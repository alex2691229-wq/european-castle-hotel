import mysql from 'mysql2/promise.js';
import bcrypt from 'bcrypt';

const connectionConfig = {
  host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '4LXYypEea3i7yhh.root',
  password: 'LJo4Cx7ChbIbRJUy',
  database: 'test',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function initializeDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('[Init] Connected to TiDB');

    // 創建 users 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(255),
        username VARCHAR(255) UNIQUE,
        passwordHash VARCHAR(255),
        name VARCHAR(255),
        email VARCHAR(255),
        loginMethod VARCHAR(50),
        role ENUM('user', 'admin') DEFAULT 'user',
        status ENUM('active', 'inactive') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP
      )
    `);
    console.log('[Init] users table created');

    // 創建 room_types 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        nameEn VARCHAR(100),
        description TEXT NOT NULL,
        descriptionEn TEXT,
        size VARCHAR(50),
        capacity INT NOT NULL DEFAULT 2,
        price DECIMAL(10, 2) NOT NULL,
        weekendPrice DECIMAL(10, 2),
        maxSalesQuantity INT DEFAULT 10 NOT NULL,
        images TEXT,
        amenities TEXT,
        isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
        displayOrder INT DEFAULT 0 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] room_types table created');

    // 創建 bookings 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roomTypeId INT NOT NULL,
        userId INT,
        guestName VARCHAR(100) NOT NULL,
        guestEmail VARCHAR(320),
        guestPhone VARCHAR(20) NOT NULL,
        checkInDate TIMESTAMP NOT NULL,
        checkOutDate TIMESTAMP NOT NULL,
        numberOfGuests INT NOT NULL DEFAULT 2,
        totalPrice DECIMAL(10, 2) NOT NULL,
        specialRequests TEXT,
        status ENUM('pending', 'confirmed', 'pending_payment', 'paid', 'cash_on_site', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] bookings table created');

    // 創建 news 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        titleEn VARCHAR(200),
        content TEXT NOT NULL,
        contentEn TEXT,
        type ENUM('announcement', 'promotion', 'event') DEFAULT 'announcement' NOT NULL,
        coverImage VARCHAR(500),
        isPublished BOOLEAN DEFAULT TRUE NOT NULL,
        publishDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] news table created');

    // 創建 facilities 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS facilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        nameEn VARCHAR(100),
        description TEXT NOT NULL,
        descriptionEn TEXT,
        icon VARCHAR(100),
        displayOrder INT DEFAULT 0 NOT NULL,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] facilities table created');

    // 創建 featured_services 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS featured_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        nameEn VARCHAR(100),
        description TEXT NOT NULL,
        descriptionEn TEXT,
        icon VARCHAR(100),
        displayOrder INT DEFAULT 0 NOT NULL,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] featured_services table created');

    // 創建 home_config 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS home_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        description VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] home_config table created');

    // 創建 contact_messages 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(320) NOT NULL,
        phone VARCHAR(20),
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'replied') DEFAULT 'new' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] contact_messages table created');

    // 創建 room_availability 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS room_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roomTypeId INT NOT NULL,
        date DATE NOT NULL,
        availableQuantity INT NOT NULL DEFAULT 0,
        blockedQuantity INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] room_availability table created');

    // 創建 payment_details 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId INT NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        paymentStatus VARCHAR(50) NOT NULL,
        bankAccountNumber VARCHAR(100),
        bankAccountName VARCHAR(100),
        transferredAmount DECIMAL(10, 2),
        transferredDate TIMESTAMP,
        lastFiveDigits VARCHAR(5),
        confirmationDate TIMESTAMP,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('[Init] payment_details table created');

    // 檢查 admin 帳號是否存在
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (rows.length === 0) {
      // 創建 admin 帳號
      const passwordHash = await bcrypt.hash('123456', 10);
      await connection.execute(
        `INSERT INTO users (username, passwordHash, name, role, status, loginMethod) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin', passwordHash, '管理員', 'admin', 'active', 'password']
      );
      console.log('[Init] Admin account created');
    } else {
      console.log('[Init] Admin account already exists');
    }

    // 添加示例房型數據（如果不存在）
    const [roomTypes] = await connection.execute('SELECT COUNT(*) as count FROM room_types');
    if (roomTypes[0].count === 0) {
      await connection.execute(`
        INSERT INTO room_types (name, nameEn, description, descriptionEn, size, capacity, price, weekendPrice, maxSalesQuantity, isAvailable, displayOrder)
        VALUES 
        ('豪華雙人房', 'Deluxe Double Room', '寬敞舒適的雙人房，配備現代化設施', 'Spacious double room with modern amenities', '30坪', 2, 1880, 2180, 10, TRUE, 1),
        ('尊爵套房', 'Executive Suite', '頂級套房，享受尊爵待遇', 'Premium suite with exclusive services', '50坪', 2, 2880, 3280, 5, TRUE, 2),
        ('家庭房', 'Family Room', '寬敞的家庭房，適合全家入住', 'Spacious family room for group stays', '45坪', 4, 2480, 2880, 8, TRUE, 3)
      `);
      console.log('[Init] Sample room types added');
    }

    // 添加示例設施數據（如果不存在）
    const [facilities] = await connection.execute('SELECT COUNT(*) as count FROM facilities');
    if (facilities[0].count === 0) {
      await connection.execute(`
        INSERT INTO facilities (name, nameEn, description, descriptionEn, icon, displayOrder, isActive)
        VALUES 
        ('免費 WiFi', 'Free WiFi', '全館提供高速無線網路', 'High-speed wireless internet throughout', 'wifi', 1, TRUE),
        ('停車場', 'Parking', '獨立私密停車空間', 'Private parking available', 'parking', 2, TRUE),
        ('24 小時服務', '24/7 Service', '全天候客房服務', 'Round-the-clock room service', 'service', 3, TRUE)
      `);
      console.log('[Init] Sample facilities added');
    }

    // 添加示例特色服務數據（如果不存在）
    const [services] = await connection.execute('SELECT COUNT(*) as count FROM featured_services');
    if (services[0].count === 0) {
      await connection.execute(`
        INSERT INTO featured_services (name, nameEn, description, descriptionEn, icon, displayOrder, isActive)
        VALUES 
        ('精緻客房', 'Deluxe Rooms', '舒適優雅的住宿空間', 'Comfortable and elegant accommodation', 'room', 1, TRUE),
        ('VIP 車庫', 'VIP Garage', '獨立私密停車空間', 'Private and secure parking', 'garage', 2, TRUE),
        ('高速網路', 'High-Speed Internet', '全館免費 WiFi', 'Free WiFi throughout the hotel', 'internet', 3, TRUE)
      `);
      console.log('[Init] Sample featured services added');
    }

    // 添加首頁配置（如果不存在）
    const [config] = await connection.execute('SELECT COUNT(*) as count FROM home_config');
    if (config[0].count === 0) {
      await connection.execute(`
        INSERT INTO home_config (config_key, value, description)
        VALUES 
        ('heroTitle', '歐堡商務汽車旅館', 'Hero section title'),
        ('heroSubtitle', '體驗永恆優雅與電影般的宏偉感，在台南新營享受奓華住宿體驗', 'Hero section subtitle'),
        ('heroImage', '', 'Hero section background image')
      `);
      console.log('[Init] Home config added');
    }

    console.log('[Init] Database initialization completed successfully');

  } catch (error) {
    console.error('[Init] Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
