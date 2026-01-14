import { describe, it, expect, beforeEach } from "vitest";
import {
  NotificationCenter,
  createBookingConfirmedNotification,
  createPaymentReceivedNotification,
  createPaymentConfirmedNotification,
  createBookingCompletedNotification,
  createPaymentReminderNotification,
  createOverdueWarningNotification,
  createAdminNewBookingNotification,
  createAdminPaymentReceivedNotification,
  createAdminPaymentConfirmedNotification,
} from "./realtime-notifications";

describe("Realtime Notifications - 實時通知系統", () => {
  let notificationCenter: NotificationCenter;

  beforeEach(() => {
    notificationCenter = new NotificationCenter();
  });

  describe("Customer Notifications - 客戶通知", () => {
    it("應該生成訂房確認通知", () => {
      const notif = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      expect(notif.type).toBe("booking_confirmed");
      expect(notif.title).toContain("✓");
      expect(notif.message).toContain("John Smith");
      expect(notif.recipientType).toBe("customer");
      console.log("✅ 訂房確認通知已生成");
    });

    it("應該生成付款已收到通知", () => {
      const notif = createPaymentReceivedNotification(120030, "John Smith", 19900);

      expect(notif.type).toBe("payment_received");
      expect(notif.title).toContain("💳");
      expect(notif.message).toContain("19,900");
      expect(notif.recipientType).toBe("customer");
      console.log("✅ 付款已收到通知已生成");
    });

    it("應該生成付款已確認通知", () => {
      const notif = createPaymentConfirmedNotification(120030, "John Smith");

      expect(notif.type).toBe("payment_confirmed");
      expect(notif.title).toContain("✅");
      expect(notif.message).toContain("John Smith");
      expect(notif.recipientType).toBe("customer");
      console.log("✅ 付款已確認通知已生成");
    });

    it("應該生成訂房已完成通知", () => {
      const notif = createBookingCompletedNotification(120030, "John Smith");

      expect(notif.type).toBe("booking_completed");
      expect(notif.title).toContain("🎉");
      expect(notif.message).toContain("John Smith");
      expect(notif.recipientType).toBe("customer");
      console.log("✅ 訂房已完成通知已生成");
    });

    it("應該生成付款提醒通知", () => {
      const notif = createPaymentReminderNotification(120030, "John Smith", 48);

      expect(notif.type).toBe("payment_reminder");
      expect(notif.title).toContain("⏰");
      expect(notif.message).toContain("John Smith");
      expect(notif.message).toContain("2");
      expect(notif.recipientType).toBe("customer");
      console.log("✅ 付款提醒通知已生成");
    });
  });

  describe("Admin Notifications - 管理員通知", () => {
    it("應該生成新訂房通知", () => {
      const notif = createAdminNewBookingNotification(
        120030,
        "John Smith",
        "john@example.com",
        "六人家庭房",
        19900
      );

      expect(notif.type).toBe("booking_confirmed");
      expect(notif.title).toContain("📋");
      expect(notif.message).toContain("120030");
      expect(notif.message).toContain("John Smith");
      expect(notif.message).toContain("六人家庭房");
      expect(notif.message).toContain("19,900");
      expect(notif.recipientType).toBe("admin");
      console.log("✅ 新訂房通知已生成");
    });

    it("應該生成付款已收到通知（管理員版本）", () => {
      const notif = createAdminPaymentReceivedNotification(
        120030,
        "John Smith",
        "john@example.com",
        19900
      );

      expect(notif.type).toBe("payment_received");
      expect(notif.title).toContain("💰");
      expect(notif.message).toContain("120030");
      expect(notif.message).toContain("John Smith");
      expect(notif.message).toContain("19,900");
      expect(notif.recipientType).toBe("admin");
      console.log("✅ 付款已收到通知（管理員版本）已生成");
    });

    it("應該生成付款已確認通知（管理員版本）", () => {
      const notif = createAdminPaymentConfirmedNotification(
        120030,
        "John Smith",
        "john@example.com",
        "12345"
      );

      expect(notif.type).toBe("payment_confirmed");
      expect(notif.title).toContain("✅");
      expect(notif.message).toContain("120030");
      expect(notif.message).toContain("John Smith");
      expect(notif.message).toContain("12345");
      expect(notif.recipientType).toBe("admin");
      console.log("✅ 付款已確認通知（管理員版本）已生成");
    });

    it("應該生成超期警告通知", () => {
      const notif = createOverdueWarningNotification(
        120030,
        "John Smith",
        "john@example.com",
        4
      );

      expect(notif.type).toBe("overdue_warning");
      expect(notif.title).toContain("⚠️");
      expect(notif.message).toContain("120030");
      expect(notif.message).toContain("John Smith");
      expect(notif.message).toContain("4");
      expect(notif.recipientType).toBe("admin");
      console.log("✅ 超期警告通知已生成");
    });
  });

  describe("NotificationCenter - 通知中心", () => {
    it("應該能夠發送通知", () => {
      const notif = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      notificationCenter.sendNotification(notif);

      const notifications = notificationCenter.getNotifications("customer");
      expect(notifications.length).toBeGreaterThan(0);
      console.log("✅ 通知已發送");
    });

    it("應該能夠訂閱通知", (done) => {
      const notif = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      let received = false;
      const unsubscribe = notificationCenter.subscribe(
        "customer",
        "john@example.com",
        (receivedNotif) => {
          received = true;
          expect(receivedNotif.type).toBe("booking_confirmed");
        }
      );

      notif.recipientEmail = "john@example.com";
      notificationCenter.sendNotification(notif);

      setTimeout(() => {
        expect(received).toBe(true);
        unsubscribe();
        console.log("✅ 通知訂閱功能正常");
        done();
      }, 100);
    });

    it("應該能夠獲取特定用戶的通知", () => {
      const notif1 = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );
      notif1.recipientEmail = "john@example.com";

      const notif2 = createBookingConfirmedNotification(
        120031,
        "Jane Doe",
        new Date("2026-01-22"),
        new Date("2026-01-27")
      );
      notif2.recipientEmail = "jane@example.com";

      notificationCenter.sendNotification(notif1);
      notificationCenter.sendNotification(notif2);

      const johnNotifs = notificationCenter.getNotifications("customer", "john@example.com");
      const janeNotifs = notificationCenter.getNotifications("customer", "jane@example.com");

      expect(johnNotifs.length).toBe(1);
      expect(janeNotifs.length).toBe(1);
      expect(johnNotifs[0].message).toContain("John Smith");
      expect(janeNotifs[0].message).toContain("Jane Doe");
      console.log("✅ 特定用戶通知獲取正常");
    });

    it("應該能夠標記通知為已讀", () => {
      const notif = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      notificationCenter.sendNotification(notif);

      expect(notif.read).toBe(false);
      notificationCenter.markAsRead(notif.id);
      expect(notif.read).toBe(true);
      console.log("✅ 通知已標記為已讀");
    });

    it("應該能夠獲取未讀通知", () => {
      const notif1 = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );
      const notif2 = createPaymentReceivedNotification(120030, "John Smith", 19900);

      notificationCenter.sendNotification(notif1);
      notificationCenter.sendNotification(notif2);

      let unreadCount = notificationCenter.getUnreadCount("customer");
      expect(unreadCount).toBe(2);

      notificationCenter.markAsRead(notif1.id);
      unreadCount = notificationCenter.getUnreadCount("customer");
      expect(unreadCount).toBe(1);

      console.log("✅ 未讀通知計數正常");
    });

    it("應該能夠刪除通知", () => {
      const notif = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      notificationCenter.sendNotification(notif);
      let notifications = notificationCenter.getNotifications("customer");
      expect(notifications.length).toBeGreaterThan(0);

      notificationCenter.deleteNotification(notif.id);
      notifications = notificationCenter.getNotifications("customer");
      expect(notifications.find(n => n.id === notif.id)).toBeUndefined();

      console.log("✅ 通知已刪除");
    });

    it("應該能夠按時間戳排序通知", () => {
      const notif1 = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      // 模擬延遲
      const notif2 = createPaymentReceivedNotification(120030, "John Smith", 19900);
      notif2.timestamp = new Date(notif1.timestamp.getTime() + 1000);

      notificationCenter.sendNotification(notif1);
      notificationCenter.sendNotification(notif2);

      const notifications = notificationCenter.getNotifications("customer");
      expect(notifications[0].id).toBe(notif2.id);
      expect(notifications[1].id).toBe(notif1.id);

      console.log("✅ 通知按時間戳正確排序");
    });

    it("應該能夠區分客戶和管理員通知", () => {
      const customerNotif = createBookingConfirmedNotification(
        120030,
        "John Smith",
        new Date("2026-01-20"),
        new Date("2026-01-25")
      );

      const adminNotif = createAdminNewBookingNotification(
        120030,
        "John Smith",
        "john@example.com",
        "六人家庭房",
        19900
      );

      notificationCenter.sendNotification(customerNotif);
      notificationCenter.sendNotification(adminNotif);

      const customerNotifs = notificationCenter.getNotifications("customer");
      const adminNotifs = notificationCenter.getNotifications("admin");

      expect(customerNotifs.length).toBe(1);
      expect(adminNotifs.length).toBe(1);
      expect(customerNotifs[0].recipientType).toBe("customer");
      expect(adminNotifs[0].recipientType).toBe("admin");

      console.log("✅ 客戶和管理員通知正確區分");
    });
  });
});
