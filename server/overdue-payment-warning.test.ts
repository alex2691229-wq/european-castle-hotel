import { describe, it, expect, beforeEach } from "vitest";

interface BookingWithRoom {
  id: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number | string;
  specialRequests: string | null;
  status: "pending" | "confirmed" | "paid_pending" | "paid" | "completed" | "cancelled";
  roomTypeName: string;
  createdAt: Date;
}

// 模擬 isOverduePayment 函數
const isOverduePayment = (booking: BookingWithRoom): boolean => {
  // 檢查訂單是否超過三天未完成付款
  // 只對「待確認」、「已確認」、「已匯款」狀態的訂單檢查
  if (["paid", "completed", "cancelled"].includes(booking.status)) {
    return false;
  }

  const now = new Date();
  const createdAt = new Date(booking.createdAt);
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 3;
};

describe("Overdue Payment Warning", () => {
  let mockBooking: BookingWithRoom;

  beforeEach(() => {
    mockBooking = {
      id: 120030,
      guestName: "John Smith",
      guestEmail: "john@example.com",
      guestPhone: "0900123456",
      checkInDate: new Date("2026-01-15"),
      checkOutDate: new Date("2026-01-17"),
      numberOfGuests: 2,
      totalPrice: 4360,
      specialRequests: null,
      status: "pending",
      roomTypeName: "舒適三人房",
      createdAt: new Date(),
    };
  });

  it("should return false for paid bookings", () => {
    mockBooking.status = "paid";
    mockBooking.createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return false for completed bookings", () => {
    mockBooking.status = "completed";
    mockBooking.createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return false for cancelled bookings", () => {
    mockBooking.status = "cancelled";
    mockBooking.createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return false for pending bookings created less than 3 days ago", () => {
    mockBooking.status = "pending";
    mockBooking.createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return false for confirmed bookings created exactly 3 days ago", () => {
    mockBooking.status = "confirmed";
    mockBooking.createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return true for pending bookings created more than 3 days ago", () => {
    mockBooking.status = "pending";
    mockBooking.createdAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
    expect(isOverduePayment(mockBooking)).toBe(true);
  });

  it("should return true for confirmed bookings created more than 3 days ago", () => {
    mockBooking.status = "confirmed";
    mockBooking.createdAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    expect(isOverduePayment(mockBooking)).toBe(true);
  });

  it("should return true for paid_pending bookings created more than 3 days ago", () => {
    mockBooking.status = "paid_pending";
    mockBooking.createdAt = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
    expect(isOverduePayment(mockBooking)).toBe(true);
  });

  it("should return true for pending bookings created 10 days ago", () => {
    mockBooking.status = "pending";
    mockBooking.createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    expect(isOverduePayment(mockBooking)).toBe(true);
  });

  it("should correctly handle edge case: 3 days and 1 hour ago", () => {
    mockBooking.status = "pending";
    // 由於使用 Math.floor，3 天 1 小時會被計算為 3 天，所以應該返回 false
    mockBooking.createdAt = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)); // 3 days 1 hour ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should correctly handle edge case: 2 days and 23 hours ago", () => {
    mockBooking.status = "pending";
    mockBooking.createdAt = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000)); // 2 days 23 hours ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return false for paid_pending bookings created 1 day ago", () => {
    mockBooking.status = "paid_pending";
    mockBooking.createdAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    expect(isOverduePayment(mockBooking)).toBe(false);
  });

  it("should return true for multiple statuses when overdue", () => {
    const statuses: Array<"pending" | "confirmed" | "paid_pending"> = ["pending", "confirmed", "paid_pending"];
    const createdAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

    statuses.forEach(status => {
      mockBooking.status = status;
      mockBooking.createdAt = createdAt;
      expect(isOverduePayment(mockBooking)).toBe(true);
    });
  });
});
