import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
console.log('Testing database connection...');
console.log('URL:', databaseUrl ? databaseUrl.replace(/:[^:]*@/, ':***@') : 'NOT SET');

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

try {
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  console.log('Connection config:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user);
  console.log('  Database:', config.database);
  console.log('  SSL:', config.ssl);

  const connection = await mysql.createConnection(config);
  console.log('✓ Connection successful!');

  // Test query
  const [rows] = await connection.query('SELECT 1 as test');
  console.log('✓ Query successful:', rows);

  await connection.end();
  console.log('✓ Connection closed');
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  process.exit(1);
}
