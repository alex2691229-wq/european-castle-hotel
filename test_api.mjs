import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function testQueries() {
  const conn = await pool.getConnection();
  
  try {
    // 測試 room_types 查詢
    console.log('\n=== 測試 room_types 查詢 ===');
    const [rooms] = await conn.query('SELECT * FROM room_types ORDER BY display_order');
    console.log(`成功查詢 ${rooms.length} 個房型`);
    
    if (rooms.length > 0) {
      console.log('\n第一個房型：');
      const room = rooms[0];
      console.log(`  ID: ${room.id}`);
      console.log(`  名稱: ${room.name}`);
      console.log(`  容量: ${room.capacity}`);
      console.log(`  價格: ${room.price}`);
      console.log(`  是否可用: ${room.isAvailable}`);
    }

    // 測試 news 查詢
    console.log('\n=== 測試 news 查詢 ===');
    const [news] = await conn.query('SELECT * FROM news LIMIT 3');
    console.log(`成功查詢 ${news.length} 條新聞`);
    
    if (news.length > 0) {
      console.log('\n第一條新聞：');
      const newsItem = news[0];
      console.log(`  ID: ${newsItem.id}`);
      console.log(`  標題: ${newsItem.title}`);
      console.log(`  類型: ${newsItem.type}`);
    }

    // 測試 home_config 查詢
    console.log('\n=== 測試 home_config 查詢 ===');
    const [config] = await conn.query('SELECT * FROM home_config LIMIT 1');
    console.log(`成功查詢 home_config，記錄數: ${config.length}`);

  } finally {
    await conn.release();
    await pool.end();
  }
}

testQueries().catch(console.error);
