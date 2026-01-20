// 簡化的 API 伺服器
import express, { Request, Response } from 'express';
import { initializeDatabase } from './db-init-simple.js';
import { query, execute } from './db-simple.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// 初始化數據庫
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('[API] Database initialization failed:', error);
    }
  }
}

// 中間件：確保數據庫已初始化
app.use(async (req, res, next) => {
  await ensureDbInitialized();
  next();
});

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// 登入 API
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 查詢用戶
    const users = await query('SELECT * FROM users WHERE username = ?', [username]) as any[];
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // 驗證密碼 (簡化版本，實際應使用 bcrypt)
    const passwordHash = Buffer.from(password).toString('base64');
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[API] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 獲取所有房型
app.get('/api/room-types', async (req: Request, res: Response) => {
  try {
    const roomTypes = await query('SELECT * FROM room_types ORDER BY display_order');
    res.json(roomTypes);
  } catch (error) {
    console.error('[API] Error fetching room types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 創建訂房
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const {
      roomTypeId,
      customerName,
      customerEmail,
      customerPhone,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalPrice,
      specialRequests,
    } = req.body;

    // 生成訂房編號
    const bookingNumber = `BK${Date.now()}`;

    const result = await execute(
      `INSERT INTO bookings 
       (booking_number, room_type_id, customer_name, customer_email, customer_phone, 
        check_in_date, check_out_date, number_of_guests, total_price, status, special_requests)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        roomTypeId,
        customerName,
        customerEmail,
        customerPhone,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        totalPrice,
        'pending',
        specialRequests,
      ]
    );

    res.json({
      id: (result as any).insertId,
      bookingNumber,
      status: 'pending',
    });
  } catch (error) {
    console.error('[API] Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 獲取所有訂房
app.get('/api/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await query(
      `SELECT b.*, r.name as room_type_name 
       FROM bookings b 
       LEFT JOIN room_types r ON b.room_type_id = r.id 
       ORDER BY b.created_at DESC`
    );
    res.json(bookings);
  } catch (error) {
    console.error('[API] Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 獲取所有新聞
app.get('/api/news', async (req: Request, res: Response) => {
  try {
    const news = await query('SELECT * FROM news ORDER BY published_at DESC');
    res.json(news);
  } catch (error) {
    console.error('[API] Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 獲取所有設施
app.get('/api/facilities', async (req: Request, res: Response) => {
  try {
    const facilities = await query('SELECT * FROM facilities ORDER BY display_order');
    res.json(facilities);
  } catch (error) {
    console.error('[API] Error fetching facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
