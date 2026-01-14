import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Calendar Sync - bookedQuantity Update", () => {
  let testRoomTypeId: number;
  let testBookingId: number;
  // 使用 UTC 日期以避免時區問題
  const testCheckIn = new Date(Date.UTC(2026, 1, 15, 0, 0, 0));
  const testCheckOut = new Date(Date.UTC(2026, 1, 17, 0, 0, 0));

  beforeAll(async () => {
    // 使用現有的房型（假設 ID 為 1）
    testRoomTypeId = 1;

    // 確保測試日期的 roomAvailability 記錄存在
    for (let i = 0; i < 2; i++) {
      const date = new Date(testCheckIn);
      date.setDate(date.getDate() + i);
      
      // 檢查是否已存在
      const existing = await db.getRoomAvailabilityByDateRange(testRoomTypeId, date, new Date(date.getTime() + 86400000));
      
      if (existing.length === 0) {
        // 創建新的可用性記錄
        await db.setRoomAvailability(testRoomTypeId, [date], true);
      }
    }
  });

  it("應該在創建訂單時增加 bookedQuantity", async () => {
    // 獲取初始的 bookedQuantity
    const initialRecords = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testCheckIn,
      testCheckOut
    );

    const initialBooked = initialRecords.map(r => r.bookedQuantity || 0);
    console.log(`初始 bookedQuantity: ${initialBooked}`);

    // 創建訂單
    testBookingId = await db.createBooking({
      roomTypeId: testRoomTypeId,
      guestName: "測試客人",
      guestEmail: "test@example.com",
      guestPhone: "0912345678",
      checkInDate: testCheckIn,
      checkOutDate: testCheckOut,
      totalPrice: "2000",
      notes: "測試訂單",
      status: "pending",
    });

    console.log(`✓ 訂單 #${testBookingId} 已創建`);
    console.log(`訂單詳情: checkIn=${testCheckIn}, checkOut=${testCheckOut}`);

    // 獲取更新後的 bookedQuantity
    const updatedRecords = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testCheckIn,
      testCheckOut
    );

    console.log(`查詢結果數量: ${updatedRecords.length}`);
    updatedRecords.forEach((r, i) => {
      console.log(`日期 ${i}: date=${r.date}, bookedQuantity=${r.bookedQuantity}`);
    });

    const updatedBooked = updatedRecords.map(r => r.bookedQuantity || 0);
    console.log(`更新後 bookedQuantity: ${updatedBooked}`);

    // 驗證 bookedQuantity 已增加
    for (let i = 0; i < updatedBooked.length; i++) {
      expect(updatedBooked[i]).toBe((initialBooked[i] || 0) + 1);
      console.log(`✓ 日期 ${i} 的 bookedQuantity 從 ${initialBooked[i] || 0} 增加到 ${updatedBooked[i]}`);
    }
  });

  it("應該在取消訂單時減少 bookedQuantity", async () => {
    // 獲取取消前的 bookedQuantity
    const beforeCancelRecords = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testCheckIn,
      testCheckOut
    );

    const beforeCancelBooked = beforeCancelRecords.map(r => r.bookedQuantity || 0);
    console.log(`取消前 bookedQuantity: ${beforeCancelBooked}`);

    // 取消訂單
    await db.updateBookingStatus(testBookingId, "cancelled");
    console.log(`✓ 訂單 #${testBookingId} 已取消`);

    // 獲取取消後的 bookedQuantity
    const afterCancelRecords = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testCheckIn,
      testCheckOut
    );

    const afterCancelBooked = afterCancelRecords.map(r => r.bookedQuantity || 0);
    console.log(`取消後 bookedQuantity: ${afterCancelBooked}`);

    // 驗證 bookedQuantity 已減少
    for (let i = 0; i < afterCancelBooked.length; i++) {
      expect(afterCancelBooked[i]).toBe(Math.max(0, (beforeCancelBooked[i] || 0) - 1));
      console.log(`✓ 日期 ${i} 的 bookedQuantity 從 ${beforeCancelBooked[i] || 0} 減少到 ${afterCancelBooked[i]}`);
    }
  });

  it("應該在刪除訂單時減少 bookedQuantity", async () => {
    // 創建新訂單
    const newBookingId = await db.createBooking({
      roomTypeId: testRoomTypeId,
      guestName: "測試客人 2",
      guestEmail: "test2@example.com",
      guestPhone: "0912345679",
      checkInDate: testCheckIn,
      checkOutDate: testCheckOut,
      totalPrice: "2000",
      notes: "測試訂單 2",
      status: "pending",
    });

    console.log(`✓ 訂單 #${newBookingId} 已創建`);

    // 獲取刪除前的 bookedQuantity
    const beforeDeleteRecords = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testCheckIn,
      testCheckOut
    );

    const beforeDeleteBooked = beforeDeleteRecords.map(r => r.bookedQuantity || 0);
    console.log(`刪除前 bookedQuantity: ${beforeDeleteBooked}`);

    // 刪除訂單
    await db.deleteBooking(newBookingId);
    console.log(`✓ 訂單 #${newBookingId} 已刪除`);

    // 獲取刪除後的 bookedQuantity
    const afterDeleteRecords = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testCheckIn,
      testCheckOut
    );

    const afterDeleteBooked = afterDeleteRecords.map(r => r.bookedQuantity || 0);
    console.log(`刪除後 bookedQuantity: ${afterDeleteBooked}`);

    // 驗證 bookedQuantity 已減少
    for (let i = 0; i < afterDeleteBooked.length; i++) {
      expect(afterDeleteBooked[i]).toBe(Math.max(0, (beforeDeleteBooked[i] || 0) - 1));
      console.log(`✓ 日期 ${i} 的 bookedQuantity 從 ${beforeDeleteBooked[i] || 0} 減少到 ${afterDeleteBooked[i]}`);
    }
  });
});
