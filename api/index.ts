import express, { Express, Request, Response } from 'express';
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
app.use((req, res, next) => {
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

// 數據庫連線健康檢查
app.get('/api/health/db', async (req: Request, res: Response) => {
  try {
    console.log('[HEALTH] Database connection check...');
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({
        status: 'error',
        message: 'Database not initialized'
      });
    }

    // 真正執行 SELECT 1 查詢來驗證連線
    try {
      const result = await db.execute(sql`SELECT 1 as test`);
      console.log('[HEALTH] Database SELECT 1 test passed:', result);
      
      res.json({
        status: 'connected',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } catch (queryError) {
      console.error('[HEALTH] SELECT 1 query failed:', queryError);
      return res.status(500).json({
        status: 'error',
        message: 'Database query failed: ' + (queryError instanceof Error ? queryError.message : 'Unknown error')
      });
    }
  } catch (error) {
    console.error('[HEALTH] Database error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 獲取所有房型（用於首頁顯示）
app.get('/api/room-types', async (req: Request, res: Response) => {
  try {
    const roomTypes = await getAllRoomTypes();
    res.json({
      success: true,
      data: roomTypes
    });
  } catch (error) {
    console.error('[API] Error fetching room types:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch room types'
    });
  }
});

// tRPC 路由 - 處理所有 /api/trpc/* 請求
app.all('/api/trpc/:path*', async (req: Request, res: Response) => {
  try {
    console.log('[tRPC] Handling request:', req.method, req.url);
    
    // 構造完整的 URL 用於 tRPC
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const pathWithQuery = req.url.startsWith('/api/trpc') ? req.url : `/api/trpc${req.url}`;
    const fullUrl = `${protocol}://${host}${pathWithQuery}`;
    
    console.log('[tRPC] Full URL:', fullUrl);
    
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: {
        ...req,
        url: fullUrl,
      } as any,
      router: appRouter,
      createContext: async () => {
        return createContext({ req, res });
      },
    });
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(await response.text());
  } catch (error) {
    console.error('[tRPC] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// 靜態文件服務
const publicDir = path.join(process.cwd(), 'dist', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  
  // SPA 路由回退
  app.get('*', (req: Request, res: Response) => {
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

export default app;
