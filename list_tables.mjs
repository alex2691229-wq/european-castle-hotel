import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function listTables() {
  const conn = await pool.getConnection();
  
  try {
    const [tables] = await conn.query('SHOW TABLES');
    console.log('\n=== 數據庫中的所有表 ===\n');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`- ${tableName}`);
    });

  } finally {
    await conn.release();
    await pool.end();
  }
}

listTables().catch(console.error);
