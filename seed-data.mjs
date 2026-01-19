/**
 * Seed Script for European Castle Hotel
 * 預填測試數據：房型、設施、房型-設施關聯
 * 
 * 使用方式：
 * node seed-data.mjs
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 連接到資料庫
const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

console.log('🌱 開始預填測試數據...\n');

try {
  // 1. 預填房型數據
  const roomTypes = [
    {
      name: '豪華雙人房',
      nameEn: 'Deluxe Double Room',
      description: '寬敞舒適的豪華雙人房，配備現代化設施和高級床上用品。',
      descriptionEn: 'Spacious and comfortable deluxe double room with modern amenities.',
      size: '35坪',
      capacity: 2,
      price: '3500',
      weekendPrice: '4200',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        'https://images.unsplash.com/photo-1618883182384-a83a8e7b9b47?w=800'
      ]),
      amenities: JSON.stringify(['WiFi', '空調', '液晶電視', '迷你吧']),
      displayOrder: 1,
      maxSalesQuantity: 5,
      isAvailable: true,
    },
    {
      name: '標準雙人房',
      nameEn: 'Standard Double Room',
      description: '舒適的標準雙人房，適合商務旅客和休閒度假。',
      descriptionEn: 'Comfortable standard double room suitable for business and leisure.',
      size: '25坪',
      capacity: 2,
      price: '2500',
      weekendPrice: '3000',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566665556112-652023ec61a4?w=800'
      ]),
      amenities: JSON.stringify(['WiFi', '空調', '液晶電視']),
      displayOrder: 2,
      maxSalesQuantity: 8,
      isAvailable: true,
    },
    {
      name: '家庭四人房',
      nameEn: 'Family Room',
      description: '寬敞的家庭房，適合家庭旅客，配備兩張雙人床。',
      descriptionEn: 'Spacious family room suitable for families with two double beds.',
      size: '45坪',
      capacity: 4,
      price: '4500',
      weekendPrice: '5500',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1611892437281-00bfe3ce2081?w=800'
      ]),
      amenities: JSON.stringify(['WiFi', '空調', '液晶電視', '迷你吧', '浴缸']),
      displayOrder: 3,
      maxSalesQuantity: 3,
      isAvailable: true,
    },
    {
      name: '經濟單人房',
      nameEn: 'Economy Single Room',
      description: '經濟實惠的單人房，適合商務旅客。',
      descriptionEn: 'Economical single room suitable for business travelers.',
      size: '15坪',
      capacity: 1,
      price: '1800',
      weekendPrice: '2200',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
      ]),
      amenities: JSON.stringify(['WiFi', '空調']),
      displayOrder: 4,
      maxSalesQuantity: 10,
      isAvailable: true,
    },
    {
      name: '蜜月套房',
      nameEn: 'Honeymoon Suite',
      description: '浪漫的蜜月套房，配備豪華設施和浪漫氛圍。',
      descriptionEn: 'Romantic honeymoon suite with luxury amenities and romantic ambiance.',
      size: '50坪',
      capacity: 2,
      price: '6500',
      weekendPrice: '8000',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800'
      ]),
      amenities: JSON.stringify(['WiFi', '空調', '液晶電視', '迷你吧', '浴缸', '按摩浴池']),
      displayOrder: 5,
      maxSalesQuantity: 2,
      isAvailable: true,
    },
  ];

  console.log('📝 預填房型數據...');
  const insertRoomType = db.prepare(`
    INSERT INTO roomTypes (
      name, nameEn, description, descriptionEn, size, capacity, price, weekendPrice,
      images, amenities, displayOrder, maxSalesQuantity, isAvailable, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const roomTypeIds = [];
  for (const room of roomTypes) {
    try {
      const result = insertRoomType.run(
        room.name,
        room.nameEn,
        room.description,
        room.descriptionEn,
        room.size,
        room.capacity,
        room.price,
        room.weekendPrice,
        room.images,
        room.amenities,
        room.displayOrder,
        room.maxSalesQuantity,
        room.isAvailable ? 1 : 0
      );
      roomTypeIds.push(result.lastInsertRowid);
      console.log(`  ✅ 房型 "${room.name}" 已建立 (ID: ${result.lastInsertRowid})`);
    } catch (error) {
      console.error(`  ❌ 房型 "${room.name}" 建立失敗:`, error.message);
    }
  }

  // 2. 預填設施數據
  const facilities = [
    {
      name: '免費 WiFi',
      nameEn: 'Free WiFi',
      description: '全館提供高速無線網路服務',
      descriptionEn: 'High-speed wireless internet available throughout the hotel',
      icon: 'wifi',
      displayOrder: 1,
    },
    {
      name: '24 小時前台',
      nameEn: '24-Hour Front Desk',
      description: '全天候客房服務和前台支援',
      descriptionEn: 'Round-the-clock room service and front desk support',
      icon: 'clock',
      displayOrder: 2,
    },
    {
      name: '免費停車',
      nameEn: 'Free Parking',
      description: '提供免費停車位',
      descriptionEn: 'Complimentary parking available',
      icon: 'car',
      displayOrder: 3,
    },
    {
      name: '空調客房',
      nameEn: 'Air Conditioning',
      description: '所有客房均配備中央空調',
      descriptionEn: 'All rooms equipped with central air conditioning',
      icon: 'snowflake',
      displayOrder: 4,
    },
    {
      name: '液晶電視',
      nameEn: 'LCD TV',
      description: '客房配備 42 吋液晶電視',
      descriptionEn: 'Rooms equipped with 42-inch LCD TV',
      icon: 'tv',
      displayOrder: 5,
    },
  ];

  console.log('\n🏨 預填設施數據...');
  const insertFacility = db.prepare(`
    INSERT INTO facilities (
      name, nameEn, description, descriptionEn, icon, displayOrder, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const facilityIds = [];
  for (const facility of facilities) {
    try {
      const result = insertFacility.run(
        facility.name,
        facility.nameEn,
        facility.description,
        facility.descriptionEn,
        facility.icon,
        facility.displayOrder
      );
      facilityIds.push(result.lastInsertRowid);
      console.log(`  ✅ 設施 "${facility.name}" 已建立 (ID: ${result.lastInsertRowid})`);
    } catch (error) {
      console.error(`  ❌ 設施 "${facility.name}" 建立失敗:`, error.message);
    }
  }

  // 3. 預填房型-設施關聯數據
  console.log('\n🔗 預填房型-設施關聯...');
  
  // 檢查 roomTypeFacilities 表是否存在
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='roomTypeFacilities'").all();
  
  if (tableInfo.length > 0) {
    const insertRoomTypeFacility = db.prepare(`
      INSERT INTO roomTypeFacilities (roomTypeId, facilityId, createdAt)
      VALUES (?, ?, datetime('now'))
    `);

    // 為每個房型關聯設施
    const roomFacilityMap = {
      0: [0, 1, 2, 3, 4], // 豪華雙人房 - 全部設施
      1: [0, 1, 2, 3, 4], // 標準雙人房 - 全部設施
      2: [0, 1, 2, 3, 4], // 家庭四人房 - 全部設施
      3: [0, 1, 2, 3],    // 經濟單人房 - 基本設施
      4: [0, 1, 2, 3, 4], // 蜜月套房 - 全部設施
    };

    for (let i = 0; i < roomTypeIds.length; i++) {
      const facilityIndices = roomFacilityMap[i] || [];
      for (const facilityIndex of facilityIndices) {
        try {
          insertRoomTypeFacility.run(roomTypeIds[i], facilityIds[facilityIndex]);
          console.log(`  ✅ 房型 ID ${roomTypeIds[i]} 關聯設施 ID ${facilityIds[facilityIndex]}`);
        } catch (error) {
          console.error(`  ❌ 關聯失敗:`, error.message);
        }
      }
    }
  } else {
    console.log('  ⚠️  roomTypeFacilities 表不存在，跳過關聯');
  }

  console.log('\n✨ 預填測試數據完成！');
  console.log(`\n📊 統計：`);
  console.log(`  - 房型: ${roomTypeIds.length} 筆`);
  console.log(`  - 設施: ${facilityIds.length} 筆`);

} catch (error) {
  console.error('❌ 預填數據失敗:', error);
  process.exit(1);
} finally {
  db.close();
}
