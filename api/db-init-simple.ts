// 數據庫初始化 - 創建所有必要的表
import { execute, query } from './db-simple.js';

export async function initializeDatabase() {
  try {
    console.log('[Database Init] Starting database initialization...');

    // 1. 創建 users 表
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        email VARCHAR(255),
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Database Init] users table created');

    // 2. 創建 room_types 表
    await execute(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        capacity INT NOT NULL,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Database Init] room_types table created');

    // 3. 創建 bookings 表
    await execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        booking_number VARCHAR(50) UNIQUE,
        room_type_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        number_of_guests INT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_status VARCHAR(50),
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
      )
    `);
    console.log('[Database Init] bookings table created');

    // 4. 創建 news 表
    await execute(`
      CREATE TABLE IF NOT EXISTS news (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        image_url VARCHAR(500),
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Database Init] news table created');

    // 5. 創建 facilities 表
    await execute(`
      CREATE TABLE IF NOT EXISTS facilities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Database Init] facilities table created');

    // 6. 創建 home_config 表
    await execute(`
      CREATE TABLE IF NOT EXISTS home_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Database Init] home_config table created');

    // 7. 初始化管理員帳號
    const adminExists = await query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists || (Array.isArray(adminExists) && adminExists.length === 0)) {
      // 使用簡單的密碼哈希 (在實際應用中應使用 bcrypt)
      const hashedPassword = Buffer.from('123456').toString('base64');
      await execute(
        'INSERT INTO users (username, password_hash, email, name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@hotel.com', 'Administrator', 'admin']
      );
      console.log('[Database Init] Admin user created (admin/123456)');
    } else {
      console.log('[Database Init] Admin user already exists');
    }

    console.log('[Database Init] Database initialization completed successfully');
  } catch (error) {
    console.error('[Database Init] Error during initialization:', error);
    throw error;
  }
}
