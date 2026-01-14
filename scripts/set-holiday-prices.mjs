import { getDb } from '../server/db.ts';
import { roomAvailability, roomTypes } from '../drizzle/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';

// 假日日期列表（2026年1月）
const holidayDates = [
  new Date('2026-01-17'), // 農曆新年
  new Date('2026-01-18'), // 農曆新年
  new Date('2026-01-24'), // 週六
  new Date('2026-01-25'), // 週日
  new Date('2026-01-31'), // 週六
];

async function setHolidayPrices() {
  const db = await getDb();
  if (!db) {
    console.error('無法連接到數據庫');
    process.exit(1);
  }

  try {
    // 查詢所有房型
    const allRoomTypes = await db.select().from(roomTypes);
    console.log(`找到 ${allRoomTypes.length} 個房型`);

    // 為每個房型和每個假日日期設置假日價格
    for (const roomType of allRoomTypes) {
      const weekendPrice = roomType.weekendPrice;
      
      if (!weekendPrice) {
        console.log(`房型 "${roomType.name}" 沒有設置假日價格，跳過`);
        continue;
      }

      for (const date of holidayDates) {
        // 檢查是否已存在記錄
        const existing = await db
          .select()
          .from(roomAvailability)
          .where(
            and(
              eq(roomAvailability.roomTypeId, roomType.id),
              eq(roomAvailability.date, date)
            )
          );

        if (existing.length > 0) {
          // 更新現有記錄
          await db
            .update(roomAvailability)
            .set({
              weekendPrice,
              isHolidayOverride: true,
            })
            .where(
              and(
                eq(roomAvailability.roomTypeId, roomType.id),
                eq(roomAvailability.date, date)
              )
            );
          console.log(`✓ 更新 ${roomType.name} - ${date.toLocaleDateString('zh-TW')} 假日價格: ${weekendPrice}`);
        } else {
          // 創建新記錄
          await db.insert(roomAvailability).values({
            roomTypeId: roomType.id,
            date,
            isAvailable: true,
            maxSalesQuantity: 10,
            bookedQuantity: 0,
            weekendPrice,
            isHolidayOverride: true,
          });
          console.log(`✓ 新增 ${roomType.name} - ${date.toLocaleDateString('zh-TW')} 假日價格: ${weekendPrice}`);
        }
      }
    }

    console.log('\n✅ 假日價格設置完成！');
  } catch (error) {
    console.error('設置假日價格時出錯:', error);
    process.exit(1);
  }
}

setHolidayPrices();
