import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function checkColumns() {
  const conn = await pool.getConnection();
  
  try {
    const [columns] = await conn.query('DESCRIBE room_types');
    
    console.log('\n=== room_types 表的實際列名（最終確認）===\n');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} ${col.Type}`);
    });

  } finally {
    await conn.release();
    await pool.end();
  }
}

checkColumns().catch(console.error);
