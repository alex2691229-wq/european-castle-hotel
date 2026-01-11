import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  connectionLimit: 1,
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'hotel',
});

const roomsData = [
  {
    id: 1,
    name: '豪華雙人房(車庫房)',
    description: '寬敞舒適的豪華雙人房，配備獨立車庫停車位，提供最高級的住宿體驗',
    size: '28坪',
    capacity: 2,
    price: '1880',
    weekendPrice: '2180',
    amenities: JSON.stringify(['獨立車庫', '雙人床', '浴缸', '高速WiFi', '空調', '電視']),
  },
  {
    id: 2,
    name: '標準雙床房(車庫房)',
    description: '配備兩張單人床的標準房型，附設獨立車庫，適合商務旅客或小家庭',
    size: '24坪',
    capacity: 2,
    price: '1980',
    weekendPrice: '2280',
    amenities: JSON.stringify(['獨立車庫', '雙單人床', '淋浴間', '高速WiFi', '空調', '電視']),
  },
  {
    id: 3,
    name: '標準雙床房(高樓層)',
    description: '位於高樓層的標準雙床房，享受城市美景，提供寧靜舒適的住宿環境',
    size: '24坪',
    capacity: 2,
    price: '1980',
    weekendPrice: '2280',
    amenities: JSON.stringify(['高樓層景觀', '雙單人床', '淋浴間', '高速WiFi', '空調', '電視']),
  },
  {
    id: 4,
    name: '舒適三人房',
    description: '配備1張單人床和1張加大雙人床，適合三人家庭或朋友同行',
    size: '30坪',
    capacity: 3,
    price: '2380',
    weekendPrice: '2880',
    amenities: JSON.stringify(['1單人床+1加大雙人床', '浴缸', '高速WiFi', '空調', '電視', '冰箱']),
  },
  {
    id: 5,
    name: '奢華四人房',
    description: '配備2張加大雙人床的奢華房型，提供最高級的設施和服務，適合家庭旅遊',
    size: '36坪',
    capacity: 4,
    price: '2880',
    weekendPrice: '3280',
    amenities: JSON.stringify(['2張加大雙人床', '浴缸', '高速WiFi', '空調', '電視', '冰箱', '沙發']),
  },
  {
    id: 6,
    name: '四人房－附淋浴',
    description: '配備4張單人床的經濟型四人房，附淋浴間，適合團體或大家庭',
    size: '32坪',
    capacity: 4,
    price: '2980',
    weekendPrice: '3280',
    amenities: JSON.stringify(['4張單人床', '淋浴間', '高速WiFi', '空調', '電視', '冰箱']),
  },
  {
    id: 7,
    name: '家庭房（6位成人）',
    description: '配備2張加大雙人床和2張日式床舖的寬敞家庭房，適合大家庭或多人團體',
    size: '42坪',
    capacity: 6,
    price: '3580',
    weekendPrice: '4180',
    amenities: JSON.stringify(['2加大雙人床+2日式床舖', '浴缸', '高速WiFi', '空調', '電視', '冰箱', '客廳']),
  },
];

async function updateRooms() {
  const connection = await pool.getConnection();
  
  try {
    for (const room of roomsData) {
      const query = `
        UPDATE roomTypes 
        SET 
          name = ?,
          description = ?,
          size = ?,
          capacity = ?,
          price = ?,
          weekendPrice = ?,
          amenities = ?,
          updatedAt = NOW()
        WHERE id = ?
      `;
      
      await connection.execute(query, [
        room.name,
        room.description,
        room.size,
        room.capacity,
        room.price,
        room.weekendPrice,
        room.amenities,
        room.id,
      ]);
      
      console.log(`✓ 已更新房型: ${room.name}`);
    }
    
    console.log('\n✅ 所有房型已成功更新！');
  } catch (error) {
    console.error('❌ 更新失敗:', error);
  } finally {
    await connection.release();
    await pool.end();
  }
}

updateRooms();
