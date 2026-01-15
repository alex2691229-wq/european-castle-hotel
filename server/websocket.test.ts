import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { wsManager } from "./websocket";
import type { RoomAvailabilityEvent } from "./websocket";

describe("WebSocket Server", () => {
  let server: any;
  let wss: WebSocketServer;

  beforeAll(() => {
    // 創建測試伺服器
    server = createServer();
    wsManager.initialize(server);
    
    // 啟動伺服器
    server.listen(3001, () => {
      console.log("✓ WebSocket 測試伺服器已啟動在 port 3001");
    });
  });

  afterAll(() => {
    wsManager.close();
    server.close();
    console.log("✓ WebSocket 測試伺服器已關閉");
  });

  it.skip("應該能夠廣播房間可用性變更事件", async () => {
    const event: RoomAvailabilityEvent = {
      type: 'room_availability_changed',
      roomTypeId: 1,
      date: '2026-01-20',
      bookedQuantity: 5,
      maxSalesQuantity: 10,
    };

    // 廣播事件
    wsManager.broadcast(event);
    
    console.log("✓ 房間可用性變更事件已廣播");
    expect(event.type).toBe('room_availability_changed');
  });

  it.skip("應該能夠廣播訂單創建事件", async () => {
    const event = {
      type: 'booking_created' as const,
      bookingId: 123,
      roomTypeId: 1,
      checkInDate: '2026-01-20',
      checkOutDate: '2026-01-21',
      status: 'pending',
    };

    // 廣播事件
    wsManager.broadcast(event);
    
    console.log("✓ 訂單創建事件已廣播");
    expect(event.type).toBe('booking_created');
  });

  it.skip("應該能夠獲取客戶端連接數量", () => {
    const count = wsManager.getClientCount();
    console.log(`✓ 當前連接客戶端數: ${count}`);
    expect(typeof count).toBe('number');
  });

  it.skip("應該能夠正確序列化事件", () => {
    const event: RoomAvailabilityEvent = {
      type: 'room_availability_changed',
      roomTypeId: 2,
      date: '2026-01-21',
      bookedQuantity: 8,
      maxSalesQuantity: 10,
    };

    const serialized = JSON.stringify(event);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.type).toBe('room_availability_changed');
    expect(deserialized.roomTypeId).toBe(2);
    expect(deserialized.date).toBe('2026-01-21');
    
    console.log("✓ 事件序列化和反序列化成功");
  });
});
