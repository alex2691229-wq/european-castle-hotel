// @ts-nocheck
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

// 配置 multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 初始化路由
try {
  // 檔案上傳路由
  app.post('/api/upload', upload.single('file'), handleUpload);

  // OAuth callback
  registerOAuthRoutes(app);

  // Initialize routes
  registerInitRoutes(app);

  // 登入路由
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
      }

      const db = await getDb();
      if (!db) {
        console.error('[Login] Database not connected');
        return res.status(500).json({ error: 'Database connection failed' });
      }

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = sign({ userId: user.id, username: user.username, role: user.role });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[Login] Error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // tRPC API
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: createContext,
    })
  );

  // 靜態檔案服務
  const publicPath = path.join(process.cwd(), 'dist', 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    
    // 所有其他路由都返回 index.html（SPA 路由）
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  } else {
    console.warn(`[Server] Public directory not found at ${publicPath}`);
    app.get('*', (req, res) => {
      res.status(404).json({ error: 'Public directory not found' });
    });
  }
} catch (error) {
  console.error('[API] Initialization error:', error);
  
  // 提供基本的錯誤路由
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'API initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  });
}

// 導出 Express 應用作為 Vercel Serverless Function
export default app;
