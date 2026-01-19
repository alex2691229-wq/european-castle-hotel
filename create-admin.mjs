import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function createAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    // 檢查是否已存在 admin 用戶
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );
    
    if (existing.length > 0) {
      console.log('⚠️  Admin user already exists');
      return;
    }
    
    const passwordHash = await bcrypt.hash('admin', 10);
    
    await connection.execute(
      'INSERT INTO users (username, passwordHash, name, loginMethod, role, status, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
      ['admin', passwordHash, 'Admin User', 'password', 'admin', 'active']
    );
    
    console.log('✅ Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createAdmin();
