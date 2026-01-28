import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function checkTables() {
  const conn = await pool.getConnection();
  
  try {
    const tables = ['home_config', 'featured_services', 'contact_messages'];
    
    for (const table of tables) {
      try {
        const [columns] = await conn.query(`DESCRIBE ${table}`);
        console.log(`\n=== ${table} 表的實際列名 ===\n`);
        columns.forEach(col => {
          console.log(`${col.Field.padEnd(25)} ${col.Type}`);
        });
      } catch (error) {
        console.log(`\n❌ ${table} 表查詢失敗:`, error.message);
      }
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

checkTables().catch(console.error);
