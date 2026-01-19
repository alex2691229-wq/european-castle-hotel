// @ts-nocheck
import "dotenv/config";
import express from 'express';
import { createServer } from 'http';
import net from 'net';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { registerOAuthRoutes } from './oauth.js';
import { appRouter } from '../routers.js';
import { createContext } from './context.js';
import { serveStatic } from './vite.js';
import { wsManager } from '../websocket.js';
import { initializeSchedulers } from '../schedulers/reminder-scheduler.js';
import { handleUpload } from './upload.js';
import { getDb } from '../db.js';
import bcrypt from 'bcrypt';
import { sign } from './jwt.js';
import { users } from '../../drizzle/schema.js';
import { registerInitRoutes } from './init-api.js';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // CORS 設定 - 允許所有訪問
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // 允許所有來源，確保連接正常
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
  // 配置身體解析器，支持較大的檔案上傳
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health Check 路由
  app.get('/api/status', (req, res) => {
    res.json({
      env: process.env.NODE_ENV || 'development',
      db: 'check_pending',
      version: 'Production-v2.1',
      timestamp: new Date().toISOString()
    });
  });
  
  // 配置 multer 用於檔案上傳
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
  
  // 檔案上傳路由
  app.post('/api/upload', upload.single('file'), handleUpload);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Initialize routes
  registerInitRoutes(app);
  
  // 登入路由 - 查詢 TiDB 資料庫
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
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Initialize WebSocket server
  wsManager.initialize(server);
  // Initialize automatic reminder schedulers
  initializeSchedulers();
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } catch (error) {
      console.warn("[Server] Failed to setup Vite in development mode:", error);
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[Scheduler] 自動提醒調度器已啟動`);
  });
}

startServer().catch(console.error);