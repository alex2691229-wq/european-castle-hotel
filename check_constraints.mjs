import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function checkConstraints() {
  const conn = await pool.getConnection();
  
  try {
    const [columns] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'room_types' AND TABLE_SCHEMA = DATABASE() 
       ORDER BY ORDINAL_POSITION`
    );
    
    console.log('\n=== room_types 表的 NOT NULL 約束 ===\n');
    columns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? '✓ NULL' : '✗ NOT NULL';
      const defaultVal = col.COLUMN_DEFAULT ? `(默認: ${col.COLUMN_DEFAULT})` : '';
      console.log(`${col.COLUMN_NAME.padEnd(20)} ${col.COLUMN_TYPE.padEnd(20)} ${nullable.padEnd(15)} ${defaultVal}`);
    });

    // 嘗試插入最小化的數據
    console.log('\n=== 測試 INSERT 操作 ===\n');
    try {
      const insertResult = await conn.query(
        `INSERT INTO room_types (name, description, capacity, price, display_order, is_available) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['測試房型', '測試描述', 2, 1000, 0, 1]
      );
      console.log('✓ INSERT 成功');
      console.log('插入的 ID:', insertResult[0].insertId);
    } catch (error) {
      console.error('✗ INSERT 失敗:', error.message);
      console.error('SQL 錯誤代碼:', error.code);
      console.error('完整錯誤:', error);
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

checkConstraints().catch(console.error);
