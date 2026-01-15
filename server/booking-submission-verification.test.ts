import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Booking Submission Verification - 訂房提交驗證", () => {
  let createdBookingId: number | null = null;

  it.skip("應該能夠使用真實郵箱提交訂房", async () => {
    const bookingData = {
      roomTypeId: 12, // 六人家庭房
      guestName: "測試客戶",
      guestEmail: "alex2691229@gmail.com",
      guestPhone: "0987654321",
      checkInDate: new Date(2026, 0, 20), // 2026/1/20
      checkOutDate: new Date(2026, 0, 25), // 2026/1/25
      numberOfGuests: 6,
      totalPrice: "19900", // 5 晚 × 3,980
      specialRequests: "需要六人家庭房",
      status: "pending" as const,
    };

    const bookingId = await db.createBooking(bookingData);
    createdBookingId = bookingId;

    expect(bookingId).toBeDefined();
    expect(typeof bookingId).toBe("number");
    expect(bookingId).toBeGreaterThan(0);
    console.log("✅ 訂房已成功提交，訂房 ID:", bookingId);
  });

  it.skip("應該能夠驗證訂單已保存到數據庫", async () => {
    if (!createdBookingId) {
      throw new Error("No booking ID available");
    }

    const booking = await db.getBookingById(createdBookingId);

    expect(booking).toBeDefined();
    expect(booking?.id).toBe(createdBookingId);
    expect(booking?.guestName).toBe("測試客戶");
    expect(booking?.guestEmail).toBe("alex2691229@gmail.com");
    expect(booking?.guestPhone).toBe("0987654321");
    expect(booking?.numberOfGuests).toBe(6);
    expect(booking?.roomTypeId).toBe(12);
    console.log("✅ 訂單已正確保存到數據庫");
  });

  it.skip("應該能夠通過電話號碼查詢訂房", async () => {
    const bookings = await db.getBookingsByPhone("0987654321");

    expect(bookings.length).toBeGreaterThan(0);
    const foundBooking = bookings.find(b => b.guestName === "測試客戶");
    expect(foundBooking).toBeDefined();
    expect(foundBooking?.id).toBe(createdBookingId);
    console.log("✅ 訂單可通過電話號碼查詢");
  });

  it.skip("應該能夠在訂單列表中看到新訂單", async () => {
    const allBookings = await db.getAllBookings();

    expect(Array.isArray(allBookings)).toBe(true);
    expect(allBookings.length).toBeGreaterThan(0);

    const foundBooking = allBookings.find(b => b.id === createdBookingId);
    expect(foundBooking).toBeDefined();
    console.log("✅ 新訂單已出現在訂單列表中");
  });

  it.skip("應該能夠驗證訂單日期範圍", async () => {
    if (!createdBookingId) {
      throw new Error("No booking ID available");
    }

    const booking = await db.getBookingById(createdBookingId);

    expect(booking?.checkInDate).toBeDefined();
    expect(booking?.checkOutDate).toBeDefined();

    const checkIn = new Date(booking!.checkInDate);
    const checkOut = new Date(booking!.checkOutDate);

    expect(checkOut.getTime()).toBeGreaterThan(checkIn.getTime());
    console.log(`✅ 訂單日期範圍正確：${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()}`);
  });

  it.skip("應該能夠驗證訂單狀態", async () => {
    if (!createdBookingId) {
      throw new Error("No booking ID available");
    }

    const booking = await db.getBookingById(createdBookingId);

    expect(booking?.status).toBeDefined();
    expect(["pending", "confirmed"]).toContain(booking?.status);
    console.log(`✅ 訂單狀態：${booking?.status}`);
  });
  it.skip("應該能夠驗證訂單金額", async () => {
    if (!createdBookingId) {
      throw new Error("No booking ID available");
    }

    const booking = await db.getBookingById(createdBookingId);

    expect(booking?.totalPrice).toBeDefined();
    // 總價可能被格式化為 "19900.00"
    const price = booking?.totalPrice || "";
    expect(price).toMatch(/^19900(\.00)?$/);
    console.log(`✅ 訂單金額：NT$ ${price}`);
  });
  afterAll(async () => {
    if (createdBookingId) {
      try {
        await db.deleteBooking(createdBookingId);
        console.log("✅ 測試訂單已清理");
      } catch (error) {
        console.error("Failed to clean up test booking:", error);
      }
    }
  });
});
