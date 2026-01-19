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
    console.log('[Init] users table created or already exists');

    // 檢查 admin 帳號是否存在
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (rows.length > 0) {
      console.log('[Init] Admin account already exists');
      return;
    }

    // 創建 admin 帳號
    const passwordHash = await bcrypt.hash('123456', 10);
    await connection.execute(
      `INSERT INTO users (username, passwordHash, name, role, status, loginMethod) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin', passwordHash, '管理員', 'admin', 'active', 'password']
    );
    console.log('[Init] Admin account created successfully');
    console.log('[Init] Username: admin');
    console.log('[Init] Password: 123456');

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
