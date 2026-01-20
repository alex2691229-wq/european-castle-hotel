import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

import { getDb, getAllRoomTypes } from './db.js';

const app: Express = express();

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
      return res.json({
        status: 'error',
        message: 'Database not initialized'
      });
    }

    res.json({
      status: 'connected',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
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
