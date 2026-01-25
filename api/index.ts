import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { sql } from 'drizzle-orm';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { getDb, getAllRoomTypes } from './db.js';
import { appRouter } from './routers.js';
import { createContext } from './_core/context.js';

const app: Express = express();

// 記錄環境變數（用於調試）
console.log('[APP] Environment check:');
console.log('[APP] DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
  console.log('[APP] DATABASE_URL (masked):', maskedUrl);
}

// CORS 設定
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 配置身體解析器
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check 路由
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    env: process.env.NODE_ENV || 'development',
    db: 'check_pending',
    version: 'Production-v2.1-Clean',
    timestamp: new Date().toISOString()
  });
});

// Database Health Check
app.get('/api/health/db', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      res.status(500).json({
        status: 'error',
        message: 'Database not initialized'
      });
      return;
    }

    // Test connection
    await db.execute(sql`SELECT 1 as test`);
    
    res.json({
      status: 'connected',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Room Types API
app.get('/api/room-types', async (req: Request, res: Response) => {
  try {
    const roomTypes = await getAllRoomTypes();
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch room types'
    });
  }
});

// tRPC Handler
app.all('/api/trpc/*', async (req: Request, res: Response) => {
  console.log(`[tRPC] ${req.method} ${req.url}`);
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: new Request(url, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      }),
      router: appRouter,
      createContext: async () => createContext({ req, res }),
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(await response.text());
  } catch (error) {
    console.error('[tRPC] Error:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }));
  }
});

// Static Files
app.use(express.static(path.join(process.cwd(), 'dist/public')));

// SPA Fallback
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(process.cwd(), 'dist/public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

export default app;
