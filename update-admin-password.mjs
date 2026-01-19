import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function updateAdminPassword() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    
    const result = await connection.execute(
      'UPDATE users SET passwordHash = ? WHERE username = ?',
      [passwordHash, 'admin']
    );
    
    if (result[0].affectedRows > 0) {
      console.log('✅ Admin password updated successfully');
      console.log('Username: admin');
      console.log('Password: 123456');
    } else {
      console.log('⚠️  Admin user not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateAdminPassword();
