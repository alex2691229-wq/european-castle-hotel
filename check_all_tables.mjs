import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function checkAllTables() {
  const conn = await pool.getConnection();
  
  try {
    const tables = ['bookings', 'facilities', 'homeConfig', 'featuredServices'];
    
    for (const table of tables) {
      try {
        const [columns] = await conn.query(`DESCRIBE ${table}`);
        console.log(`\n=== ${table} 表的實際列名 ===\n`);
        columns.forEach(col => {
          console.log(`${col.Field.padEnd(25)} ${col.Type}`);
        });
      } catch (error) {
        console.log(`\n❌ ${table} 表不存在或查詢失敗`);
      }
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

checkAllTables().catch(console.error);
