import { Express } from 'express';
import { getDb } from '../db.js.js';
import bcrypt from 'bcrypt';
import { users } from '../../drizzle/schema.js.js';
import { eq } from 'drizzle-orm';

export async function registerInitRoutes(app: Express) {
  // 手動初始化 admin 帳號
  app.post('/api/init-admin', async (req, res) => {
    try {
      console.log('[Init] Received init-admin request');
      
      const db = await getDb();
      if (!db) {
        console.error('[Init] Database not connected');
        return res.status(500).json({ 
          success: false,
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please check DATABASE_URL environment variable.'
        });
      }
      
      console.log('[Init] Database connected, checking for existing admin');
      
      // 檢查是否已有 admin 帳號
      const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
      
      if (existingAdmin.length > 0) {
        console.log('[Init] Admin account already exists');
        return res.json({ 
          success: true,
          message: 'Admin account already exists',
          user: {
            id: existingAdmin[0].id,
            username: existingAdmin[0].username,
            name: existingAdmin[0].name
          }
        });
      }
      
      console.log('[Init] Creating new admin account');
      
      // 創建新的 admin 帳號
      const passwordHash = await bcrypt.hash('123456', 10);
      
      const result = await db.insert(users).values({
        username: 'admin',
        passwordHash,
        name: '管理員',
        role: 'admin',
        loginMethod: 'password',
        status: 'active',
      });
      
      console.log('[Init] Admin account created successfully');
      
      res.json({
        success: true,
        message: 'Admin account created successfully',
        credentials: {
          username: 'admin',
          password: '123456'
        },
        warning: 'Please change the password after first login!'
      });
      
    } catch (error) {
      console.error('[Init] Error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Initialization failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 檢查資料庫連線狀態
  app.get('/api/health/db', async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ 
          status: 'disconnected',
          message: 'Database connection failed'
        });
      }
      
      // 嘗試查詢資料庫
      const result = await db.select().from(users).limit(1);
      
      res.json({
        status: 'connected',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Health] Database error:', error);
      res.status(503).json({
        status: 'error',
        message: 'Database query failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
