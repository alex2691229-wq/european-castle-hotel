// @ts-nocheck
// 確保環境變數診斷代碼執行
import { ENV } from './_core/env.js';

import express from 'express';
// @ts-nocheck
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

// 直接導入本地複製的檔案
import { registerOAuthRoutes } from './_core/oauth.js';
import { appRouter } from './routers.js';
import { createContext } from './_core/context.js';
import { handleUpload } from './_core/upload.js';
import { getDb } from './db.js';
import bcrypt from 'bcrypt';
import { sign } from './_core/jwt.js';
import { registerInitRoutes } from './_core/init-api.js';

const app = express();

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
app.get('/api/status', (req, res) => {
  res.json({
    env: process.env.NODE_ENV || 'development',
    db: 'check_pending',
    version: 'Production-v2.1',
    timestamp: new Date().toISOString()
  });
});

// 診斷路由
app.get('/api/health/db', async (req, res) => {
  console.log('[HEALTH] Diagnostics requested');
  console.log('[HEALTH] DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('[HEALTH] BUILT_IN_FORGE_API_URL exists:', !!process.env.BUILT_IN_FORGE_API_URL);
  console.log('[HEALTH] BUILT_IN_FORGE_API_KEY exists:', !!process.env.BUILT_IN_FORGE_API_KEY);
  
  try {
    const db = getDb();
    res.json({
      status: db ? 'ok' : 'error',
      env: {
        databaseUrl: !!process.env.DATABASE_URL,
        forgeApiUrl: !!process.env.BUILT_IN_FORGE_API_URL,
        forgeApiKey: !!process.env.BUILT_IN_FORGE_API_KEY
      }
    });
  } catch (error) {
    console.error('[HEALTH] Error:', error);
    res.json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 配置 multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 上傳路由
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await handleUpload(req.file);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
});

// 初始化路由
registerInitRoutes(app);

// OAuth 路由
registerOAuthRoutes(app);

// tRPC 路由
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 靜態檔案服務
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use('/api', express.static(publicDir));
}

// 導出 Express 應用
export default app;
