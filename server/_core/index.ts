import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { wsManager } from "../websocket";
import { initializeSchedulers } from "../schedulers/reminder-scheduler";

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
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // 暴力登入路由 - 簡單驗證 admin / 123456
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 簡單驗證
      if (username === 'admin' && password === '123456') {
        const token = 'simple-token-' + Date.now();
        res.json({
          success: true,
          token,
          user: {
            id: 1,
            username: 'admin',
            name: '管理員',
            email: 'admin@example.com',
            role: 'admin'
          }
        });
      } else {
        res.status(401).json({ error: '帳號或密碼錯誤' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: '登入失敗' });
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
    await setupVite(app, server);
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