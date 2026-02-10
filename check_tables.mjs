import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
const url = new URL(databaseUrl);
const host = url.hostname;
const port = parseInt(url.port || '3306');
const user = url.username;
const password = url.password;
const database = url.pathname.split('/')[1];

const connection = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
});

// 查詢所有表
const [tables] = await connection.execute('SHOW TABLES');
console.log('[Tables] All tables in database:');
console.table(tables);

// 嘗試查詢 users 表
try {
  const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
  console.log('\n[Users] Data in users table:');
  console.table(users);
} catch (err) {
  console.log('\n[Users] Error querying users table:', err.message);
}

await connection.end();
