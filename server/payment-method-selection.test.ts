import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Payment Method Selection", () => {
  let testBookingId: number;

  beforeAll(async () => {
    // 創建一個測試訂單
    testBookingId = await db.createBooking({
      roomTypeId: 1,
      guestName: "測試客人",
      guestEmail: "test@example.com",
      guestPhone: "0912345678",
      checkInDate: new Date("2026-02-01"),
      checkOutDate: new Date("2026-02-02"),
      totalPrice: "2000",
      notes: "測試訂單",
      status: "pending",
    });

    // 確認訂單
    await db.updateBookingStatus(testBookingId, "confirmed");
  });

  it.skip("應該能夠選擇現場支付方式", async () => {
    const booking = await db.getBookingById(testBookingId);
    expect(booking?.status).toBe("confirmed");

    // 選擇現場支付
    await db.updateBookingStatus(testBookingId, "cash_on_site");

    const updatedBooking = await db.getBookingById(testBookingId);
    expect(updatedBooking?.status).toBe("cash_on_site");
    console.log(`✓ 訂單 #${testBookingId} 狀態已更新為 cash_on_site`);
  });

  it.skip("應該能夠選擇銀行轉帳方式", async () => {
    // 重新確認訂單以測試銀行轉帳
    await db.updateBookingStatus(testBookingId, "confirmed");

    const booking = await db.getBookingById(testBookingId);
    expect(booking?.status).toBe("confirmed");

    // 選擇銀行轉帳
    await db.updateBookingStatus(testBookingId, "pending_payment");

    const updatedBooking = await db.getBookingById(testBookingId);
    expect(updatedBooking?.status).toBe("pending_payment");
    console.log(`✓ 訂單 #${testBookingId} 狀態已更新為 pending_payment`);
  });

  it.skip("應該能夠從待付款轉換為已付款", async () => {
    const booking = await db.getBookingById(testBookingId);
    expect(booking?.status).toBe("pending_payment");

    // 確認銀行轉帳
    await db.updateBookingStatus(testBookingId, "paid");

    const updatedBooking = await db.getBookingById(testBookingId);
    expect(updatedBooking?.status).toBe("paid");
    console.log(`✓ 訂單 #${testBookingId} 狀態已更新為 paid`);
  });

  it.skip("應該能夠從已付款轉換為已完成", async () => {
    const booking = await db.getBookingById(testBookingId);
    expect(booking?.status).toBe("paid");

    // 標記入住
    await db.updateBookingStatus(testBookingId, "completed");

    const updatedBooking = await db.getBookingById(testBookingId);
    expect(updatedBooking?.status).toBe("completed");
    console.log(`✓ 訂單 #${testBookingId} 狀態已更新為 completed`);
  });

  it.skip("應該能夠驗證 cash_on_site 狀態", async () => {
    // 重新確認訂單
    await db.updateBookingStatus(testBookingId, "confirmed");
    
    // 選擇現場支付
    await db.updateBookingStatus(testBookingId, "cash_on_site");
    
    const booking = await db.getBookingById(testBookingId);
    expect(booking?.status).toBe("cash_on_site");
    console.log(`✓ 訂單 #${testBookingId} 狀態 cash_on_site 驗證成功`);
  });
});
