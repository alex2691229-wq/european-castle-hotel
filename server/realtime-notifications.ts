/**
 * 實時通知系統
 * 處理訂房狀態變更、付款確認等實時通知
 */

export type NotificationType = 
  | "booking_confirmed"      // 訂房已確認
  | "payment_received"       // 已收到匯款
  | "payment_confirmed"      // 付款已確認（收到後五碼）
  | "booking_completed"      // 訂房已完成
  | "booking_cancelled"      // 訂房已取消
  | "payment_reminder"       // 付款提醒
  | "overdue_warning";       // 超期警告

export interface Notification {
  id: string;
  bookingId: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  recipientType: "customer" | "admin";
  recipientEmail?: string;
}

/**
 * 生成訂房確認通知
 */
export function createBookingConfirmedNotification(
  bookingId: number,
  guestName: string,
  checkInDate: Date,
  checkOutDate: Date
): Notification {
  const checkIn = new Date(checkInDate).toLocaleDateString("zh-TW");
  const checkOut = new Date(checkOutDate).toLocaleDateString("zh-TW");

  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "booking_confirmed",
    title: "✓ 訂房已確認",
    message: `${guestName}，您的訂房已確認。入住日期：${checkIn}，退房日期：${checkOut}。請在 3 天內完成匯款。`,
    timestamp: new Date(),
    read: false,
    recipientType: "customer",
  };
}

/**
 * 生成付款已收到通知
 */
export function createPaymentReceivedNotification(
  bookingId: number,
  guestName: string,
  amount: number | string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "payment_received",
    title: "💳 已收到您的匯款",
    message: `${guestName}，我們已收到您的匯款（NT$ ${Number(amount).toLocaleString()}）。請回覆郵件填寫轉帳憑證後五碼以完成確認。`,
    timestamp: new Date(),
    read: false,
    recipientType: "customer",
  };
}

/**
 * 生成付款已確認通知
 */
export function createPaymentConfirmedNotification(
  bookingId: number,
  guestName: string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "payment_confirmed",
    title: "✅ 付款已確認",
    message: `${guestName}，您的付款已確認。您的房間已預留。感謝您的訂房，期待為您服務！`,
    timestamp: new Date(),
    read: false,
    recipientType: "customer",
  };
}

/**
 * 生成訂房已完成通知
 */
export function createBookingCompletedNotification(
  bookingId: number,
  guestName: string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "booking_completed",
    title: "🎉 訂房已完成",
    message: `${guestName}，感謝您選擇歐堡商務汽車旅館。期待為您提供優質的住宿體驗！`,
    timestamp: new Date(),
    read: false,
    recipientType: "customer",
  };
}

/**
 * 生成訂房已取消通知
 */
export function createBookingCancelledNotification(
  bookingId: number,
  guestName: string,
  reason?: string
): Notification {
  const reasonText = reason ? `原因：${reason}` : "";

  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "booking_cancelled",
    title: "✕ 訂房已取消",
    message: `${guestName}，您的訂房已取消。${reasonText}如有疑問，請聯繫我們。`,
    timestamp: new Date(),
    read: false,
    recipientType: "customer",
  };
}

/**
 * 生成付款提醒通知
 */
export function createPaymentReminderNotification(
  bookingId: number,
  guestName: string,
  hoursRemaining: number
): Notification {
  const daysRemaining = Math.ceil(hoursRemaining / 24);

  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "payment_reminder",
    title: "⏰ 付款提醒",
    message: `${guestName}，您的訂房將在 ${daysRemaining} 天後過期。請盡快完成匯款以保留您的房間。`,
    timestamp: new Date(),
    read: false,
    recipientType: "customer",
  };
}

/**
 * 生成超期警告通知（給管理員）
 */
export function createOverdueWarningNotification(
  bookingId: number,
  guestName: string,
  guestEmail: string,
  daysSinceCreation: number
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "overdue_warning",
    title: "⚠️ 訂房超期未付款",
    message: `訂房 #${bookingId}（${guestName}，${guestEmail}）已超過 ${daysSinceCreation} 天未完成付款。請聯繫客戶跟進。`,
    timestamp: new Date(),
    read: false,
    recipientType: "admin",
    recipientEmail: guestEmail,
  };
}

/**
 * 生成管理員通知 - 新訂房
 */
export function createAdminNewBookingNotification(
  bookingId: number,
  guestName: string,
  guestEmail: string,
  roomType: string,
  totalPrice: number | string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "booking_confirmed",
    title: "📋 新訂房",
    message: `新訂房 #${bookingId}：${guestName}（${guestEmail}），房型：${roomType}，金額：NT$ ${Number(totalPrice).toLocaleString()}。`,
    timestamp: new Date(),
    read: false,
    recipientType: "admin",
    recipientEmail: guestEmail,
  };
}

/**
 * 生成管理員通知 - 付款已收到
 */
export function createAdminPaymentReceivedNotification(
  bookingId: number,
  guestName: string,
  guestEmail: string,
  amount: number | string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "payment_received",
    title: "💰 已收到付款",
    message: `訂房 #${bookingId}（${guestName}）已收到匯款 NT$ ${Number(amount).toLocaleString()}。等待客戶確認後五碼。`,
    timestamp: new Date(),
    read: false,
    recipientType: "admin",
    recipientEmail: guestEmail,
  };
}

/**
 * 生成管理員通知 - 付款已確認
 */
export function createAdminPaymentConfirmedNotification(
  bookingId: number,
  guestName: string,
  guestEmail: string,
  lastFiveDigits: string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    bookingId,
    type: "payment_confirmed",
    title: "✅ 付款已確認",
    message: `訂房 #${bookingId}（${guestName}）的付款已確認。轉帳憑證後五碼：${lastFiveDigits}。`,
    timestamp: new Date(),
    read: false,
    recipientType: "admin",
    recipientEmail: guestEmail,
  };
}

/**
 * 通知中心 - 管理所有通知
 */
export class NotificationCenter {
  private notifications: Map<string, Notification> = new Map();
  private subscribers: Map<string, Set<(notif: Notification) => void>> = new Map();

  /**
   * 發送通知
   */
  sendNotification(notification: Notification): void {
    this.notifications.set(notification.id, notification);

    // 通知所有訂閱者
    const key = `${notification.recipientType}_${notification.recipientEmail || "admin"}`;
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(notification));
    }

    console.log(`📤 通知已發送：${notification.title}`);
  }

  /**
   * 訂閱通知
   */
  subscribe(
    recipientType: "customer" | "admin",
    recipientEmail: string,
    callback: (notif: Notification) => void
  ): () => void {
    const key = `${recipientType}_${recipientEmail}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // 返回取消訂閱函數
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * 獲取通知
   */
  getNotifications(
    recipientType: "customer" | "admin",
    recipientEmail?: string,
    unreadOnly: boolean = false
  ): Notification[] {
    const notifications = Array.from(this.notifications.values()).filter(notif => {
      if (notif.recipientType !== recipientType) return false;
      if (recipientEmail && notif.recipientEmail !== recipientEmail) return false;
      if (unreadOnly && notif.read) return false;
      return true;
    });

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 標記通知為已讀
   */
  markAsRead(notificationId: string): void {
    const notif = this.notifications.get(notificationId);
    if (notif) {
      notif.read = true;
      console.log(`✅ 通知已標記為已讀：${notif.title}`);
    }
  }

  /**
   * 刪除通知
   */
  deleteNotification(notificationId: string): void {
    this.notifications.delete(notificationId);
    console.log(`🗑️ 通知已刪除`);
  }

  /**
   * 獲取未讀通知數
   */
  getUnreadCount(
    recipientType: "customer" | "admin",
    recipientEmail?: string
  ): number {
    return this.getNotifications(recipientType, recipientEmail, true).length;
  }
}

// 全局通知中心實例
export const notificationCenter = new NotificationCenter();
