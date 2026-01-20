import mysql from 'mysql2/promise';

const databaseUrl = 'mysql://2p8ob8h7CK7Zznh.root:y4sK02wAdqgjyWMq@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test';

console.log('Fixing database schema...');

try {
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };

  const connection = await mysql.createConnection(config);
  console.log('✓ Connected to database');

  // 檢查 users 表的結構
  const [columns] = await connection.query('DESCRIBE users');
  const columnNames = columns.map(c => c.Field);
  console.log('Current columns:', columnNames);

  // 添加缺失的列
  const missingColumns = [
    { name: 'username', sql: 'ALTER TABLE users ADD COLUMN username VARCHAR(64)' },
    { name: 'passwordHash', sql: 'ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255)' },
    { name: 'status', sql: 'ALTER TABLE users ADD COLUMN status ENUM("active", "inactive") DEFAULT "active"' },
  ];

  for (const col of missingColumns) {
    if (!columnNames.includes(col.name)) {
      try {
        await connection.query(col.sql);
        console.log(`✓ Added column: ${col.name}`);
      } catch (err) {
        console.log(`⚠ Column ${col.name}: ${err.message}`);
      }
    } else {
      console.log(`✓ Column ${col.name} already exists`);
    }
  }

  console.log('✓ Schema fix completed');
  await connection.end();
} catch (error) {
  console.error('✗ Fix failed:', error.message);
  process.exit(1);
}
