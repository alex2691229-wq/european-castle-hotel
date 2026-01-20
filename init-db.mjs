import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL || 'mysql://2p8ob8h7CK7Zznh.root:y4sK02wAdqgjyWMq@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test';

console.log('Starting database initialization...');
console.log('URL:', databaseUrl.replace(/:[^:]*@/, ':***@'));

try {
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  const connection = await mysql.createConnection(config);
  console.log('✓ Connected to database');

  // 讀取所有 SQL 遷移文件
  const drizzleDir = path.join(process.cwd(), 'drizzle');
  const sqlFiles = fs.readdirSync(drizzleDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${sqlFiles.length} migration files`);

  for (const file of sqlFiles) {
    const filePath = path.join(drizzleDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // 分割多個 SQL 語句
    const statements = sql.split('-->').map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      if (statement) {
        try {
          console.log(`Executing: ${file} - ${statement.substring(0, 50)}...`);
          await connection.query(statement);
        } catch (err) {
          // 忽略 "table already exists" 錯誤
          if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
            console.log(`  ⚠ Skipped (already exists)`);
          } else {
            console.error(`  ✗ Error: ${err.message}`);
          }
        }
      }
    }
  }

  console.log('✓ Database initialization completed');
  await connection.end();
} catch (error) {
  console.error('✗ Initialization failed:', error.message);
  process.exit(1);
}
