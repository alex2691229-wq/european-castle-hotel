import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
const url = new URL(databaseUrl);
const host = url.hostname;
const port = parseInt(url.port || '3306');
const user = url.username;
const password = url.password;
const database = url.pathname.split('/')[1];

console.log(`[Query] Connecting to ${host}:${port} as ${user}...`);

const connection = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log('[Query] Connected! Querying users table...');

const [rows] = await connection.execute('SELECT id, username, password, email, role FROM users LIMIT 10');
console.log('[Query] Users in database:');
console.table(rows);

await connection.end();
