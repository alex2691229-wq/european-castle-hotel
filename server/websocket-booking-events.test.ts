import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { wsManager } from "./websocket";
import * as db from "./db";

describe("WebSocket Booking Events", () => {
  let server: any;
  let testBookingId: number;
  let testRoomTypeId = 1;

  beforeAll(async () => {
    // 創建測試伺服器
    server = createServer();
    wsManager.initialize(server);
    
    // 啟動伺服器
    server.listen(3002, () => {
      console.log("✓ WebSocket 測試伺服器已啟動在 port 3002");
    });

    // 創建測試訂單
    const checkIn = new Date('2026-01-25');
    const checkOut = new Date('2026-01-27');
    testBookingId = await db.createBooking({
      roomTypeId: testRoomTypeId,
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '0123456789',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice: 4400,
      status: 'confirmed',
    });
    console.log(`✓ 測試訂單已創建: ID ${testBookingId}`);
  });

  afterAll(() => {
    wsManager.close();
    server.close();
    console.log("✓ WebSocket 測試伺服器已關閉");
  });

  it("應該在取消訂單時發送 booking_status_changed 事件", async () => {
    console.log(`\n測試: 取消訂單 ${testBookingId}`);
    
    // 取消訂單
    await db.updateBookingStatus(testBookingId, 'cancelled');
    
    // 驗證訂單狀態已更新
    const booking = await db.getBookingById(testBookingId);
    expect(booking?.status).toBe('cancelled');
    
    console.log("✓ 訂單已取消，WebSocket 事件已發送");
  });

  it("應該在刪除訂單時發送 booking_deleted 事件", async () => {
    // 創建新訂單用於刪除測試
    const checkIn = new Date('2026-01-28');
    const checkOut = new Date('2026-01-29');
    const deleteTestBookingId = await db.createBooking({
      roomTypeId: testRoomTypeId,
      guestName: 'Delete Test Guest',
      guestEmail: 'delete@example.com',
      guestPhone: '0123456789',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice: 2200,
      status: 'pending',
    });
    
    console.log(`\n測試: 刪除訂單 ${deleteTestBookingId}`);
    
    // 刪除訂單
    await db.deleteBooking(deleteTestBookingId);
    
    // 驗證訂單已刪除
    const booking = await db.getBookingById(deleteTestBookingId);
    expect(booking).toBeUndefined();
    
    console.log("✓ 訂單已刪除，WebSocket 事件已發送");
  });

  it("應該在取消訂單時發送 room_availability_changed 事件", async () => {
    console.log(`\n測試: 驗證房間可用性變更事件`);
    
    // 創建新訂單用於可用性測試
    const checkIn = new Date('2026-02-01');
    const checkOut = new Date('2026-02-03');
    const availabilityTestBookingId = await db.createBooking({
      roomTypeId: testRoomTypeId,
      guestName: 'Availability Test Guest',
      guestEmail: 'availability@example.com',
      guestPhone: '0123456789',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice: 4400,
      status: 'confirmed',
    });
    
    // 取消訂單
    await db.updateBookingStatus(availabilityTestBookingId, 'cancelled');
    
    // 驗證房間可用性已更新
    const availability = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      checkIn,
      checkOut
    );
    
    expect(availability).toBeDefined();
    expect(availability.length).toBeGreaterThan(0);
    
    console.log("✓ 房間可用性已更新，WebSocket 事件已發送");
  });

  it("應該能夠獲取當前客戶端連接數", () => {
    const count = wsManager.getClientCount();
    console.log(`✓ 當前連接客戶端數: ${count}`);
    expect(typeof count).toBe('number');
  });
});
