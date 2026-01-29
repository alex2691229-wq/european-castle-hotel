import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function verifySchema() {
  const conn = await pool.getConnection();
  
  try {
    console.log('\n=== 最終 Schema 驗證 ===\n');
    
    // 1. 查詢表結構
    console.log('-- room_types 表的列名 --');
    const [columns] = await conn.query('DESCRIBE room_types');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });
    
    // 2. 查詢實際數據
    console.log('\n-- 查詢前 5 條房型數據 --');
    const [rows] = await conn.query('SELECT id, name, nameEn, description, descriptionEn, price, weekendPrice, display_order FROM room_types LIMIT 5');
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, NameEn: ${row.nameEn}, Price: ${row.price}, WeekendPrice: ${row.weekendPrice}, DisplayOrder: ${row.display_order}`);
    });
    
    // 3. 測試 Drizzle 生成的 SQL
    console.log('\n-- 測試 Drizzle 生成的 SELECT 語句 --');
    try {
      const [drizzleRows] = await conn.query(
        'SELECT id, name, nameEn, description, descriptionEn, size, capacity, price, weekendPrice, images, amenities, isAvailable, display_order, createdAt, updatedAt, maxSalesQuantity FROM room_types LIMIT 1'
      );
      console.log('✓ Drizzle SQL 查詢成功！');
      console.log('  返回行數:', drizzleRows.length);
      if (drizzleRows.length > 0) {
        console.log('  第一行數據:', drizzleRows[0]);
      }
    } catch (error) {
      console.error('✗ Drizzle SQL 查詢失敗:', error.message);
      console.error('  SQL 錯誤代碼:', error.code);
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

verifySchema().catch(console.error);
