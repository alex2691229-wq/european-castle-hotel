import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function testRawSQL() {
  const conn = await pool.getConnection();
  
  try {
    console.log('\n=== 測試原始 SQL INSERT（繞過 Drizzle）===\n');
    
    // 測試 1：使用完整的列名插入
    try {
      const result = await conn.query(
        `INSERT INTO room_types (name, description, capacity, price, display_order, isAvailable, nameEn, descriptionEn, weekendPrice, maxSalesQuantity) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['原始 SQL 測試', '描述', 2, 1500, 100, 1, 'Raw SQL Test', 'Description', 1800, 5]
      );
      console.log('✓ 原始 SQL INSERT 成功！');
      console.log('插入的 ID:', result[0].insertId);
      
      // 驗證插入的數據
      const [rows] = await conn.query('SELECT * FROM room_types WHERE id = ?', [result[0].insertId]);
      console.log('\n插入的數據：');
      console.log(rows[0]);
    } catch (error) {
      console.error('✗ 原始 SQL INSERT 失敗:', error.message);
      console.error('SQL:', error.sql);
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

testRawSQL().catch(console.error);
