import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!match) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

const connection = await mysql.createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: 'default',
});

console.log('[Schema Check] Connected to TiDB');

// Check room_types table structure
const [rows] = await connection.query('DESCRIBE room_types');
console.log('\n[room_types Table Structure]:');
rows.forEach(row => {
  console.log(`  ${row.Field}: ${row.Type} | NULL: ${row.Null} | Key: ${row.Key} | Extra: ${row.Extra}`);
});

// Check for AUTO_INCREMENT
const [autoInc] = await connection.query("SHOW CREATE TABLE room_types");
console.log('\n[room_types AUTO_INCREMENT]:');
const createTable = autoInc[0]['Create Table'];
if (createTable.includes('AUTO_INCREMENT')) {
  console.log('  ✓ AUTO_INCREMENT is enabled');
} else {
  console.log('  ✗ AUTO_INCREMENT is NOT enabled');
}

// Check news table structure
const [newsRows] = await connection.query('DESCRIBE news');
console.log('\n[news Table Structure]:');
newsRows.forEach(row => {
  console.log(`  ${row.Field}: ${row.Type} | NULL: ${row.Null} | Key: ${row.Key} | Extra: ${row.Extra}`);
});

await connection.end();
console.log('\n[Schema Check] Complete');
