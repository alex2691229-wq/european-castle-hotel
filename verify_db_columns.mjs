import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function verifyColumns() {
  const conn = await pool.getConnection();
  
  try {
    console.log('\n=== 驗證 TiDB 中的實際列名（確認 snake_case）===\n');
    
    const tables = ['room_types', 'home_config', 'news', 'facilities', 'featured_services'];
    
    for (const table of tables) {
      try {
        const [columns] = await conn.query(`DESCRIBE ${table}`);
        console.log(`\n-- ${table} 表 --`);
        columns.forEach(col => {
          console.log(`  ${col.Field}`);
        });
      } catch (error) {
        console.error(`✗ ${table} 查詢失敗:`, error.message);
      }
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

verifyColumns().catch(console.error);
