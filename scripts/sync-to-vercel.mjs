#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import mysql from 'mysql2/promise';

const localDbUrl = process.env.DATABASE_URL;
const vercelDbUrl = 'mysql://2p8ob8h7CK7Zznh.root:vNmR8q3aVoJTs6To@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl=true';

async function parseUrl(urlStr) {
  const url = new URL(urlStr);
  return {
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  };
}

async function main() {
  try {
    console.log('📊 開始同步數據到 Vercel TiDB 實例...\n');

    const localConfig = await parseUrl(localDbUrl);
    const vercelConfig = await parseUrl(vercelDbUrl);

    // 連接到本地數據庫
    console.log('🔗 連接到本地 TiDB 實例...');
    const localConn = await mysql.createConnection({
      ...localConfig,
      ssl: { rejectUnauthorized: false },
    });
    console.log('✅ 本地連接成功\n');

    // 連接到 Vercel 數據庫
    console.log('🔗 連接到 Vercel TiDB 實例...');
    const vercelConn = await mysql.createConnection({
      ...vercelConfig,
      ssl: { rejectUnauthorized: false },
    });
    console.log('✅ Vercel 連接成功\n');

    // 查詢本地房型數據
    console.log('📥 從本地數據庫查詢房型數據...');
    const [roomTypes] = await localConn.execute('SELECT * FROM room_types');
    console.log(`✅ 查詢到 ${roomTypes.length} 個房型\n`);

    // 在 Vercel 數據庫中插入房型數據（使用 snake_case 列名）
    if (roomTypes.length > 0) {
      console.log('📤 向 Vercel 數據庫插入房型數據...');
      
      for (const room of roomTypes) {
        const sql = `
          INSERT INTO room_types (
            name, name_en, description, description_en, size, capacity, price, weekend_price, 
            max_sales_quantity, images, amenities, isAvailable, displayOrder, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          room.name,
          room.nameEn || null,
          room.description,
          room.descriptionEn || null,
          room.size || null,
          room.capacity,
          room.price,
          room.weekendPrice || null,
          room.maxSalesQuantity,
          room.images || null,
          room.amenities || null,
          room.isAvailable ? 1 : 0,
          room.display_order || 0,
          room.createdAt,
          room.updatedAt,
        ];
        
        try {
          await vercelConn.execute(sql, values);
          console.log(`  ✅ 已插入房型：${room.name}`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`  ℹ️  房型 ${room.name} 已存在，跳過`);
          } else {
            console.log(`  ⚠️  房型 ${room.name} 插入失敗：${error.message.slice(0, 50)}`);
          }
        }
      }
      
      console.log('\n✅ 房型數據同步完成！');
    }

    await localConn.end();
    await vercelConn.end();

    console.log('\n🎉 所有數據已成功同步到 Vercel TiDB 實例！');
  } catch (error) {
    console.error('❌ 錯誤：', error.message);
    process.exit(1);
  }
}

main();
