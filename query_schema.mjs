import mysql from 'mysql2/promise.js';

// 從 DATABASE_URL 解析連接信息
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL:', dbUrl.substring(0, 50) + '...');

const pool = mysql.createPool(dbUrl);

async function querySchema() {
  const conn = await pool.getConnection();
  
  try {
    // 查詢 home_config 表
    console.log('\n=== home_config 表結構 ===');
    const [homeConfigCols] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'home_config' AND TABLE_SCHEMA = DATABASE() 
       ORDER BY ORDINAL_POSITION`
    );
    homeConfigCols.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 查詢 news 表
    console.log('\n=== news 表結構 ===');
    const [newsCols] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'news' AND TABLE_SCHEMA = DATABASE() 
       ORDER BY ORDINAL_POSITION`
    );
    newsCols.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 查詢 room_types 表
    console.log('\n=== room_types 表結構 ===');
    const [roomTypesCols] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'room_types' AND TABLE_SCHEMA = DATABASE() 
       ORDER BY ORDINAL_POSITION`
    );
    roomTypesCols.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 查詢 room_types 表的數據
    console.log('\n=== room_types 表數據 ===');
    const [roomTypesData] = await conn.query('SELECT COUNT(*) as count FROM room_types');
    console.log(`Total rooms: ${roomTypesData[0].count}`);
    
    const [firstRoom] = await conn.query('SELECT * FROM room_types LIMIT 1');
    if (firstRoom.length > 0) {
      console.log('First room:', firstRoom[0]);
    }
  } finally {
    await conn.release();
    await pool.end();
  }
}

querySchema().catch(console.error);
