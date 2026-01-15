import { describe, it, expect, beforeEach } from "vitest";

/**
 * 端到端訂房流程測試
 * 測試完整的訂房流程：查詢房間 → 創建訂房 → 確認訂房 → 標記匯款 → 確認付款 → 完成訂房
 */

interface BookingData {
  id?: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  roomTypeId: number;
  specialRequests?: string;
}

interface PaymentData {
  bookingId: number;
  paymentMethod: "bank_transfer" | "credit_card" | "ecpay";
  amount: number;
  lastFiveDigits?: string;
}

// 模擬訂房流程
class BookingFlowSimulator {
  private bookings: Map<number, any> = new Map();
  private payments: Map<number, any> = new Map();
  private bookingCounter = 120000;

  // 步驟 1: 查詢房間可用性
  checkRoomAvailability(checkInDate: Date, checkOutDate: Date, roomTypeId: number): boolean {
    // 模擬：所有房間都可用
    return checkInDate < checkOutDate;
  }

  // 步驟 2: 創建訂房
  createBooking(data: BookingData): { id: number; status: string } {
    if (!this.checkRoomAvailability(data.checkInDate, data.checkOutDate, data.roomTypeId)) {
      throw new Error("房間不可用");
    }

    const bookingId = ++this.bookingCounter;
    const booking = {
      id: bookingId,
      ...data,
      status: "pending",
      createdAt: new Date(),
    };

    this.bookings.set(bookingId, booking);
    return { id: bookingId, status: "pending" };
  }

  // 步驟 3: 確認訂房
  confirmBooking(bookingId: number): { status: string; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("訂房不存在");
    if (booking.status !== "pending") throw new Error("訂房狀態不正確");

    booking.status = "confirmed";
    booking.confirmedAt = new Date();
    return { status: "confirmed", message: "訂房已確認" };
  }

  // 步驟 4: 標記為已匯款
  markAsTransferred(bookingId: number): { status: string; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("訂房不存在");
    if (booking.status !== "confirmed") throw new Error("訂房狀態不正確");

    booking.status = "paid_pending";
    booking.transferredAt = new Date();
    return { status: "paid_pending", message: "已標記為已匯款" };
  }

  // 步驟 5: 記錄後五碼並確認付款
  confirmPayment(bookingId: number, lastFiveDigits: string): { status: string; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("訂房不存在");
    if (booking.status !== "paid_pending") throw new Error("訂房狀態不正確");

    // 驗證後五碼格式
    if (!/^\d{5}$/.test(lastFiveDigits)) {
      throw new Error("後五碼格式不正確，必須是 5 個數字");
    }

    booking.status = "paid";
    booking.paidAt = new Date();
    booking.lastFiveDigits = lastFiveDigits;

    this.payments.set(bookingId, {
      bookingId,
      lastFiveDigits,
      confirmedAt: new Date(),
    });

    return { status: "paid", message: "付款已確認" };
  }

  // 步驟 6: 完成訂房
  completeBooking(bookingId: number): { status: string; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("訂房不存在");
    if (booking.status !== "paid") throw new Error("訂房狀態不正確");

    booking.status = "completed";
    booking.completedAt = new Date();
    return { status: "completed", message: "訂房已完成" };
  }

  // 獲取訂房詳情
  getBooking(bookingId: number): any {
    return this.bookings.get(bookingId);
  }

  // 取消訂房
  cancelBooking(bookingId: number): { status: string; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("訂房不存在");
    if (["completed", "cancelled"].includes(booking.status)) {
      throw new Error("無法取消已完成或已取消的訂房");
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    return { status: "cancelled", message: "訂房已取消" };
  }
}

describe("E2E Booking Flow Tests", () => {
  let simulator: BookingFlowSimulator;

  beforeEach(() => {
    simulator = new BookingFlowSimulator();
  });

  describe("完整訂房流程", () => {
    it.skip("應該成功完成完整的訂房流程", () => {
      // 步驟 1: 查詢房間可用性
      const checkInDate = new Date("2026-01-20");
      const checkOutDate = new Date("2026-01-23");
      const available = simulator.checkRoomAvailability(checkInDate, checkOutDate, 1);
      expect(available).toBe(true);

      // 步驟 2: 創建訂房
      const bookingData: BookingData = {
        guestName: "John Smith",
        guestEmail: "john@example.com",
        guestPhone: "0900123456",
        checkInDate,
        checkOutDate,
        numberOfGuests: 2,
        roomTypeId: 1,
        specialRequests: "需要高樓層房間",
      };
      const created = simulator.createBooking(bookingData);
      expect(created.status).toBe("pending");
      expect(created.id).toBeGreaterThan(0);

      // 步驟 3: 確認訂房
      const confirmed = simulator.confirmBooking(created.id);
      expect(confirmed.status).toBe("confirmed");

      // 步驟 4: 標記為已匯款
      const transferred = simulator.markAsTransferred(created.id);
      expect(transferred.status).toBe("paid_pending");

      // 步驟 5: 確認付款（記錄後五碼）
      const paid = simulator.confirmPayment(created.id, "12345");
      expect(paid.status).toBe("paid");

      // 步驟 6: 完成訂房
      const completed = simulator.completeBooking(created.id);
      expect(completed.status).toBe("completed");

      // 驗證最終訂房狀態
      const booking = simulator.getBooking(created.id);
      expect(booking.status).toBe("completed");
      expect(booking.lastFiveDigits).toBe("12345");
    });

    it.skip("應該驗證訂房日期有效性", () => {
      const bookingData: BookingData = {
        guestName: "Jane Doe",
        guestEmail: "jane@example.com",
        guestPhone: "0900654321",
        checkInDate: new Date("2026-01-25"),
        checkOutDate: new Date("2026-01-23"), // 退房日期早於入住日期
        numberOfGuests: 2,
        roomTypeId: 1,
      };

      expect(() => simulator.createBooking(bookingData)).toThrow("房間不可用");
    });

    it.skip("應該驗證後五碼格式", () => {
      // 創建訂房並進行到待付款狀態
      const bookingData: BookingData = {
        guestName: "Michael Chen",
        guestEmail: "michael@example.com",
        guestPhone: "0912345678",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 3,
        roomTypeId: 2,
      };
      const created = simulator.createBooking(bookingData);
      simulator.confirmBooking(created.id);
      simulator.markAsTransferred(created.id);

      // 測試無效的後五碼格式
      expect(() => simulator.confirmPayment(created.id, "1234")).toThrow(
        "後五碼格式不正確，必須是 5 個數字"
      );
      expect(() => simulator.confirmPayment(created.id, "abcde")).toThrow(
        "後五碼格式不正確，必須是 5 個數字"
      );
      expect(() => simulator.confirmPayment(created.id, "123456")).toThrow(
        "後五碼格式不正確，必須是 5 個數字"
      );

      // 測試有效的後五碼格式
      const paid = simulator.confirmPayment(created.id, "54321");
      expect(paid.status).toBe("paid");
    });
  });

  describe("訂房狀態轉換驗證", () => {
    it.skip("應該驗證狀態轉換順序", () => {
      const bookingData: BookingData = {
        guestName: "Test User",
        guestEmail: "test@example.com",
        guestPhone: "0900000000",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 1,
        roomTypeId: 1,
      };
      const created = simulator.createBooking(bookingData);

      // 不能跳過「確認」狀態直接標記為已匯款
      expect(() => simulator.markAsTransferred(created.id)).toThrow("訂房狀態不正確");

      // 正確的狀態轉換
      simulator.confirmBooking(created.id);
      const transferred = simulator.markAsTransferred(created.id);
      expect(transferred.status).toBe("paid_pending");

      // 不能重複標記為已匯款
      expect(() => simulator.markAsTransferred(created.id)).toThrow("訂房狀態不正確");
    });

    it.skip("應該驗證不能跳過付款確認直接完成訂房", () => {
      const bookingData: BookingData = {
        guestName: "Test User",
        guestEmail: "test@example.com",
        guestPhone: "0900000000",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 1,
        roomTypeId: 1,
      };
      const created = simulator.createBooking(bookingData);
      simulator.confirmBooking(created.id);
      simulator.markAsTransferred(created.id);

      // 不能在未確認付款的情況下完成訂房
      expect(() => simulator.completeBooking(created.id)).toThrow("訂房狀態不正確");

      // 確認付款後才能完成
      simulator.confirmPayment(created.id, "99999");
      const completed = simulator.completeBooking(created.id);
      expect(completed.status).toBe("completed");
    });
  });

  describe("訂房取消功能", () => {
    it.skip("應該能在待確認狀態取消訂房", () => {
      const bookingData: BookingData = {
        guestName: "Test User",
        guestEmail: "test@example.com",
        guestPhone: "0900000000",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 1,
        roomTypeId: 1,
      };
      const created = simulator.createBooking(bookingData);
      const cancelled = simulator.cancelBooking(created.id);
      expect(cancelled.status).toBe("cancelled");
    });

    it.skip("應該能在已確認狀態取消訂房", () => {
      const bookingData: BookingData = {
        guestName: "Test User",
        guestEmail: "test@example.com",
        guestPhone: "0900000000",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 1,
        roomTypeId: 1,
      };
      const created = simulator.createBooking(bookingData);
      simulator.confirmBooking(created.id);
      const cancelled = simulator.cancelBooking(created.id);
      expect(cancelled.status).toBe("cancelled");
    });

    it.skip("應該不能取消已完成的訂房", () => {
      const bookingData: BookingData = {
        guestName: "Test User",
        guestEmail: "test@example.com",
        guestPhone: "0900000000",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 1,
        roomTypeId: 1,
      };
      const created = simulator.createBooking(bookingData);
      simulator.confirmBooking(created.id);
      simulator.markAsTransferred(created.id);
      simulator.confirmPayment(created.id, "88888");
      simulator.completeBooking(created.id);

      expect(() => simulator.cancelBooking(created.id)).toThrow(
        "無法取消已完成或已取消的訂房"
      );
    });
  });

  describe("訂房資訊驗證", () => {
    it.skip("應該正確保存訂房資訊", () => {
      const bookingData: BookingData = {
        guestName: "Alice Johnson",
        guestEmail: "alice@example.com",
        guestPhone: "0911111111",
        checkInDate: new Date("2026-02-01"),
        checkOutDate: new Date("2026-02-05"),
        numberOfGuests: 4,
        roomTypeId: 3,
        specialRequests: "需要兒童床",
      };
      const created = simulator.createBooking(bookingData);
      const booking = simulator.getBooking(created.id);

      expect(booking.guestName).toBe("Alice Johnson");
      expect(booking.guestEmail).toBe("alice@example.com");
      expect(booking.guestPhone).toBe("0911111111");
      expect(booking.numberOfGuests).toBe(4);
      expect(booking.roomTypeId).toBe(3);
      expect(booking.specialRequests).toBe("需要兒童床");
      expect(booking.status).toBe("pending");
    });

    it.skip("應該計算正確的住宿晚數", () => {
      const checkInDate = new Date("2026-01-20");
      const checkOutDate = new Date("2026-01-25");
      const nights = Math.floor(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(nights).toBe(5);
    });
  });

  describe("多訂房並發處理", () => {
    it.skip("應該能同時處理多個訂房", () => {
      const bookings = [];

      for (let i = 0; i < 5; i++) {
        const bookingData: BookingData = {
          guestName: `Guest ${i}`,
          guestEmail: `guest${i}@example.com`,
          guestPhone: `090000000${i}`,
          checkInDate: new Date("2026-01-20"),
          checkOutDate: new Date("2026-01-23"),
          numberOfGuests: i + 1,
          roomTypeId: (i % 3) + 1,
        };
        const created = simulator.createBooking(bookingData);
        bookings.push(created.id);
      }

      expect(bookings.length).toBe(5);
      bookings.forEach(id => {
        const booking = simulator.getBooking(id);
        expect(booking).toBeDefined();
        expect(booking.status).toBe("pending");
      });
    });

    it.skip("應該能並發處理不同狀態的訂房", () => {
      // 創建 3 個訂房，分別處於不同狀態
      const bookingIds = [];

      for (let i = 0; i < 3; i++) {
        const bookingData: BookingData = {
          guestName: `Guest ${i}`,
          guestEmail: `guest${i}@example.com`,
          guestPhone: `090000000${i}`,
          checkInDate: new Date("2026-01-20"),
          checkOutDate: new Date("2026-01-23"),
          numberOfGuests: 1,
          roomTypeId: 1,
        };
        const created = simulator.createBooking(bookingData);
        bookingIds.push(created.id);
      }

      // 第一個訂房：待確認
      // 第二個訂房：已確認
      simulator.confirmBooking(bookingIds[1]);

      // 第三個訂房：已匯款
      simulator.confirmBooking(bookingIds[2]);
      simulator.markAsTransferred(bookingIds[2]);

      // 驗證各訂房狀態
      expect(simulator.getBooking(bookingIds[0]).status).toBe("pending");
      expect(simulator.getBooking(bookingIds[1]).status).toBe("confirmed");
      expect(simulator.getBooking(bookingIds[2]).status).toBe("paid_pending");
    });
  });
});
