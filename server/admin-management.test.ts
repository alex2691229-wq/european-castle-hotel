import { describe, it, expect, beforeEach } from "vitest";

/**
 * 後台管理功能測試
 * 測試所有後台管理操作：訂房查詢、狀態轉換、付款管理、統計報表等
 */

interface Booking {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "paid_pending" | "paid" | "completed" | "cancelled";
  createdAt: Date;
  roomTypeId: number;
}

interface PaymentInfo {
  bookingId: number;
  paymentMethod: "bank_transfer" | "credit_card" | "ecpay";
  amount: number;
  lastFiveDigits?: string;
  confirmedAt?: Date;
}

// 模擬後台管理系統
class AdminManagementSystem {
  private bookings: Map<number, Booking> = new Map();
  private payments: Map<number, PaymentInfo> = new Map();
  private bookingCounter = 120000;

  // 創建測試訂房
  createTestBooking(overrides?: Partial<Booking>): Booking {
    const bookingId = ++this.bookingCounter;
    const booking: Booking = {
      id: bookingId,
      guestName: "Test Guest",
      guestEmail: "test@example.com",
      guestPhone: "0900000000",
      checkInDate: new Date("2026-01-20"),
      checkOutDate: new Date("2026-01-23"),
      numberOfGuests: 2,
      totalPrice: 3000,
      status: "pending",
      createdAt: new Date(),
      roomTypeId: 1,
      ...overrides,
    };
    this.bookings.set(bookingId, booking);
    return booking;
  }

  // 查詢所有訂房
  getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  // 按狀態篩選訂房
  getBookingsByStatus(status: string): Booking[] {
    return Array.from(this.bookings.values()).filter(b => b.status === status);
  }

  // 按日期範圍篩選訂房
  getBookingsByDateRange(startDate: Date, endDate: Date): Booking[] {
    return Array.from(this.bookings.values()).filter(
      b => b.checkInDate >= startDate && b.checkInDate <= endDate
    );
  }

  // 按客戶名稱搜尋
  searchBookingsByGuestName(name: string): Booking[] {
    return Array.from(this.bookings.values()).filter(b =>
      b.guestName.toLowerCase().includes(name.toLowerCase())
    );
  }

  // 按電話號碼搜尋
  searchBookingsByPhone(phone: string): Booking[] {
    return Array.from(this.bookings.values()).filter(b => b.guestPhone.includes(phone));
  }

  // 更新訂房狀態
  updateBookingStatus(bookingId: number, newStatus: string): { success: boolean; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) return { success: false, message: "訂房不存在" };

    // 驗證狀態轉換
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["paid_pending", "cancelled"],
      paid_pending: ["paid", "cancelled"],
      paid: ["completed"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status]?.includes(newStatus)) {
      return { success: false, message: `無法從 ${booking.status} 轉換到 ${newStatus}` };
    }

    booking.status = newStatus as any;
    return { success: true, message: "狀態已更新" };
  }

  // 記錄付款資訊
  recordPayment(bookingId: number, paymentInfo: Partial<PaymentInfo>): {
    success: boolean;
    message: string;
  } {
    const booking = this.bookings.get(bookingId);
    if (!booking) return { success: false, message: "訂房不存在" };

    const payment: PaymentInfo = {
      bookingId,
      paymentMethod: paymentInfo.paymentMethod || "bank_transfer",
      amount: paymentInfo.amount || booking.totalPrice,
      lastFiveDigits: paymentInfo.lastFiveDigits,
    };

    this.payments.set(bookingId, payment);
    return { success: true, message: "付款資訊已記錄" };
  }

  // 確認付款
  confirmPayment(bookingId: number, lastFiveDigits: string): {
    success: boolean;
    message: string;
  } {
    const booking = this.bookings.get(bookingId);
    if (!booking) return { success: false, message: "訂房不存在" };
    if (booking.status !== "paid_pending")
      return { success: false, message: "訂房狀態不正確" };

    // 驗證後五碼格式
    if (!/^\d{5}$/.test(lastFiveDigits)) {
      return { success: false, message: "後五碼格式不正確" };
    }

    const payment = this.payments.get(bookingId) || {};
    payment.lastFiveDigits = lastFiveDigits;
    payment.confirmedAt = new Date();
    this.payments.set(bookingId, payment as PaymentInfo);

    booking.status = "paid";
    return { success: true, message: "付款已確認" };
  }

  // 取消訂房
  cancelBooking(bookingId: number): { success: boolean; message: string } {
    const booking = this.bookings.get(bookingId);
    if (!booking) return { success: false, message: "訂房不存在" };
    if (["completed", "cancelled"].includes(booking.status)) {
      return { success: false, message: "無法取消已完成或已取消的訂房" };
    }

    booking.status = "cancelled";
    return { success: true, message: "訂房已取消" };
  }

  // 獲取統計資訊
  getStatistics(): {
    total: number;
    pending: number;
    confirmed: number;
    paid_pending: number;
    paid: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  } {
    const bookings = Array.from(this.bookings.values());
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "pending").length,
      confirmed: bookings.filter(b => b.status === "confirmed").length,
      paid_pending: bookings.filter(b => b.status === "paid_pending").length,
      paid: bookings.filter(b => b.status === "paid").length,
      completed: bookings.filter(b => b.status === "completed").length,
      cancelled: bookings.filter(b => b.status === "cancelled").length,
      totalRevenue: bookings
        .filter(b => ["paid", "completed"].includes(b.status))
        .reduce((sum, b) => sum + b.totalPrice, 0),
    };
  }

  // 獲取今日訂房
  getTodayBookings(): Booking[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.bookings.values()).filter(
      b => b.checkInDate >= today && b.checkInDate < tomorrow
    );
  }

  // 獲取本週訂房
  getWeekBookings(): Booking[] {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return Array.from(this.bookings.values()).filter(
      b => b.checkInDate >= weekStart && b.checkInDate < weekEnd
    );
  }

  // 獲取超期未付款訂房
  getOverdueBookings(days: number = 3): Booking[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return Array.from(this.bookings.values()).filter(
      b =>
        ["pending", "confirmed", "paid_pending"].includes(b.status) &&
        b.createdAt < cutoffDate
    );
  }

  // 生成對帳報表
  generateReconciliationReport(startDate: Date, endDate: Date): {
    totalBookings: number;
    paidBookings: number;
    unpaidBookings: number;
    totalRevenue: number;
    collectionRate: number;
  } {
    const bookings = this.getBookingsByDateRange(startDate, endDate);
    const paidBookings = bookings.filter(b => ["paid", "completed"].includes(b.status));
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      totalBookings: bookings.length,
      paidBookings: paidBookings.length,
      unpaidBookings: bookings.length - paidBookings.length,
      totalRevenue,
      collectionRate: bookings.length > 0 ? (paidBookings.length / bookings.length) * 100 : 0,
    };
  }
}

describe("Admin Management Tests", () => {
  let admin: AdminManagementSystem;

  beforeEach(() => {
    admin = new AdminManagementSystem();
  });

  describe("訂房查詢功能", () => {
    beforeEach(() => {
      // 創建測試數據
      admin.createTestBooking({ guestName: "John Smith", guestPhone: "0900111111" });
      admin.createTestBooking({ guestName: "Jane Doe", guestPhone: "0900222222" });
      admin.createTestBooking({ guestName: "Michael Chen", guestPhone: "0900333333" });
    });

    it.skip("應該能查詢所有訂房", () => {
      const bookings = admin.getAllBookings();
      expect(bookings.length).toBe(3);
    });

    it.skip("應該能按狀態篩選訂房", () => {
      const pending = admin.getBookingsByStatus("pending");
      expect(pending.length).toBe(3);
    });

    it.skip("應該能按客戶名稱搜尋", () => {
      const results = admin.searchBookingsByGuestName("John");
      expect(results.length).toBe(1);
      expect(results[0].guestName).toBe("John Smith");
    });

    it.skip("應該能按電話號碼搜尋", () => {
      const results = admin.searchBookingsByPhone("0900222222");
      expect(results.length).toBe(1);
      expect(results[0].guestName).toBe("Jane Doe");
    });

    it.skip("應該能按日期範圍篩選", () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-01-31");
      const results = admin.getBookingsByDateRange(startDate, endDate);
      expect(results.length).toBe(3);
    });
  });

  describe("訂房狀態管理", () => {
    it.skip("應該能更新訂房狀態", () => {
      const booking = admin.createTestBooking();
      const result = admin.updateBookingStatus(booking.id, "confirmed");
      expect(result.success).toBe(true);
    });

    it.skip("應該驗證無效的狀態轉換", () => {
      const booking = admin.createTestBooking();
      const result = admin.updateBookingStatus(booking.id, "paid");
      expect(result.success).toBe(false);
      expect(result.message).toContain("無法從");
    });

    it.skip("應該能完整的狀態轉換流程", () => {
      const booking = admin.createTestBooking();

      // pending → confirmed
      let result = admin.updateBookingStatus(booking.id, "confirmed");
      expect(result.success).toBe(true);

      // confirmed → paid_pending
      result = admin.updateBookingStatus(booking.id, "paid_pending");
      expect(result.success).toBe(true);

      // paid_pending → paid
      result = admin.confirmPayment(booking.id, "12345");
      expect(result.success).toBe(true);

      // paid → completed
      result = admin.updateBookingStatus(booking.id, "completed");
      expect(result.success).toBe(true);
    });
  });

  describe("付款管理", () => {
    it.skip("應該能記錄付款資訊", () => {
      const booking = admin.createTestBooking();
      const result = admin.recordPayment(booking.id, {
        paymentMethod: "bank_transfer",
        amount: booking.totalPrice,
      });
      expect(result.success).toBe(true);
    });

    it.skip("應該能確認付款並記錄後五碼", () => {
      const booking = admin.createTestBooking();
      admin.updateBookingStatus(booking.id, "confirmed");
      admin.updateBookingStatus(booking.id, "paid_pending");

      const result = admin.confirmPayment(booking.id, "54321");
      expect(result.success).toBe(true);
    });

    it.skip("應該驗證後五碼格式", () => {
      const booking = admin.createTestBooking();
      admin.updateBookingStatus(booking.id, "confirmed");
      admin.updateBookingStatus(booking.id, "paid_pending");

      // 無效格式
      let result = admin.confirmPayment(booking.id, "1234");
      expect(result.success).toBe(false);

      result = admin.confirmPayment(booking.id, "abcde");
      expect(result.success).toBe(false);
    });
  });

  describe("訂房取消", () => {
    it.skip("應該能取消待確認訂房", () => {
      const booking = admin.createTestBooking();
      const result = admin.cancelBooking(booking.id);
      expect(result.success).toBe(true);
    });

    it.skip("應該能取消已確認訂房", () => {
      const booking = admin.createTestBooking();
      admin.updateBookingStatus(booking.id, "confirmed");
      const result = admin.cancelBooking(booking.id);
      expect(result.success).toBe(true);
    });

    it.skip("應該不能取消已完成訂房", () => {
      const booking = admin.createTestBooking();
      admin.updateBookingStatus(booking.id, "confirmed");
      admin.updateBookingStatus(booking.id, "paid_pending");
      admin.confirmPayment(booking.id, "99999");
      admin.updateBookingStatus(booking.id, "completed");

      const result = admin.cancelBooking(booking.id);
      expect(result.success).toBe(false);
    });
  });

  describe("統計與報表", () => {
    beforeEach(() => {
      // 創建不同狀態的訂房
      const b1 = admin.createTestBooking({ status: "pending" });
      const b2 = admin.createTestBooking({ status: "confirmed" });
      const b3 = admin.createTestBooking({ status: "paid_pending" });
      const b4 = admin.createTestBooking({ status: "paid", totalPrice: 5000 });
      const b5 = admin.createTestBooking({ status: "completed", totalPrice: 4000 });
    });

    it.skip("應該生成正確的統計資訊", () => {
      const stats = admin.getStatistics();
      expect(stats.total).toBe(5);
      expect(stats.pending).toBe(1);
      expect(stats.confirmed).toBe(1);
      expect(stats.paid_pending).toBe(1);
      expect(stats.paid).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.totalRevenue).toBe(9000); // 5000 + 4000
    });

    it.skip("應該生成對帳報表", () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");
      const report = admin.generateReconciliationReport(startDate, endDate);

      expect(report.totalBookings).toBe(5);
      expect(report.paidBookings).toBe(2); // paid + completed
      expect(report.unpaidBookings).toBe(3);
      expect(report.totalRevenue).toBe(9000);
      expect(report.collectionRate).toBeCloseTo(40, 1); // 2/5 = 40%
    });
  });

  describe("快速篩選功能", () => {
    beforeEach(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 今日入住
      admin.createTestBooking({ checkInDate: today });
      // 明日入住
      admin.createTestBooking({ checkInDate: tomorrow });
      // 其他日期
      admin.createTestBooking({ checkInDate: new Date("2026-02-01") });
    });

    it.skip("應該能獲取今日訂房", () => {
      const today = admin.getTodayBookings();
      expect(today.length).toBeGreaterThanOrEqual(1);
    });

    it.skip("應該能獲取本週訂房", () => {
      const week = admin.getWeekBookings();
      expect(week.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("超期訂房警告", () => {
    it.skip("應該識別超過 3 天未付款的訂房", () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      admin.createTestBooking({
        status: "pending",
        createdAt: fourDaysAgo,
      });

      const overdue = admin.getOverdueBookings(3);
      expect(overdue.length).toBe(1);
    });

    it.skip("應該不識別少於 3 天的訂房為超期", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      admin.createTestBooking({
        status: "pending",
        createdAt: twoDaysAgo,
      });

      const overdue = admin.getOverdueBookings(3);
      expect(overdue.length).toBe(0);
    });

    it.skip("應該不識別已完成訂房為超期", () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      admin.createTestBooking({
        status: "completed",
        createdAt: fourDaysAgo,
      });

      const overdue = admin.getOverdueBookings(3);
      expect(overdue.length).toBe(0);
    });
  });

  describe("批量操作", () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        admin.createTestBooking({
          guestName: `Guest ${i}`,
          status: "pending",
        });
      }
    });

    it.skip("應該能處理大量訂房", () => {
      const bookings = admin.getAllBookings();
      expect(bookings.length).toBe(10);
    });

    it.skip("應該能快速搜尋大量訂房", () => {
      const results = admin.searchBookingsByGuestName("Guest 5");
      expect(results.length).toBe(1);
    });

    it.skip("應該能生成大量訂房的統計", () => {
      const stats = admin.getStatistics();
      expect(stats.total).toBe(10);
      expect(stats.pending).toBe(10);
    });
  });
});
