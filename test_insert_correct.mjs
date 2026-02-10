import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function testInsert() {
  const conn = await pool.getConnection();
  
  try {
    console.log('\n=== 測試正確列名的 INSERT 操作 ===\n');
    
    try {
      const insertResult = await conn.query(
        `INSERT INTO room_types (name, description, capacity, price, display_order, isAvailable) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['測試房型 - 正確', '測試描述', 2, 1500, 99, 1]
      );
      console.log('✓ INSERT 成功！');
      console.log('插入的 ID:', insertResult[0].insertId);
      
      // 驗證插入的數據
      const [rows] = await conn.query('SELECT * FROM room_types WHERE id = ?', [insertResult[0].insertId]);
      console.log('\n插入的數據：');
      console.log(rows[0]);
    } catch (error) {
      console.error('✗ INSERT 失敗:', error.message);
      console.error('SQL:', error.sql);
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

testInsert().catch(console.error);
