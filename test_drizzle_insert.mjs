import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise.js';
import * as schema from './drizzle/schema.ts';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);
const db = drizzle(pool, { schema });

async function testDrizzleInsert() {
  try {
    console.log('\n=== 測試 Drizzle ORM INSERT 操作 ===\n');
    
    // 使用 Drizzle ORM 插入
    const result = await db.insert(schema.roomTypes).values({
      name: 'Drizzle 測試房型',
      nameEn: 'Drizzle Test Room',
      description: '用 Drizzle ORM 插入的房型',
      descriptionEn: 'Room inserted via Drizzle ORM',
      capacity: 3,
      price: 2000,
      weekendPrice: 2500,
      maxSalesQuantity: 8,
      isAvailable: true,
      displayOrder: 50,
    });
    
    console.log('✓ Drizzle INSERT 成功！');
    console.log('插入結果:', result);
    
    // 驗證插入的數據
    const rooms = await db.select().from(schema.roomTypes).where(
      schema.roomTypes.name.eq('Drizzle 測試房型')
    );
    
    console.log('\n查詢結果：');
    console.log(rooms[0]);
    
  } catch (error) {
    console.error('✗ Drizzle INSERT 失敗:', error.message);
    console.error('詳細錯誤:', error);
  } finally {
    await pool.end();
  }
}

testDrizzleInsert();
