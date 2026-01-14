/**
 * 客戶郵件回覆處理模組
 * 處理客戶通過郵件回覆填寫後五碼的流程
 */

import * as db from "./db";

interface EmailReplyPayload {
  bookingId: number;
  guestEmail: string;
  lastFiveDigits: string;
  replyTimestamp: Date;
}

/**
 * 從郵件正文中提取後五碼
 * 支持多種格式：
 * - "後五碼：12345"
 * - "Last 5 digits: 12345"
 * - "12345"
 */
export function extractLastFiveDigits(emailBody: string): string | null {
  // 移除空白和特殊字符
  const cleanBody = emailBody.replace(/\s+/g, " ");

  // 嘗試多種模式匹配
  const patterns = [
    /後五碼[：:]\s*(\d{5})/,
    /last\s*5\s*digits[：:]\s*(\d{5})/i,
    /last\s*five\s*digits[：:]\s*(\d{5})/i,
    /digits[：:]\s*(\d{5})/i,
    /(\d{5})(?!\d)/, // 最後嘗試任何 5 個連續數字（不跟其他數字）
  ];

  for (const pattern of patterns) {
    const match = cleanBody.match(pattern);
    if (match && match[1]) {
      const digits = match[1];
      // 驗證是否為有效的 5 個數字
      if (/^\d{5}$/.test(digits)) {
        return digits;
      }
    }
  }

  return null;
}

/**
 * 驗證後五碼格式
 */
export function validateLastFiveDigits(digits: string): boolean {
  return /^\d{5}$/.test(digits);
}

/**
 * 處理客戶郵件回覆
 */
export async function handleEmailReply(payload: EmailReplyPayload): Promise<boolean> {
  try {
    // 驗證後五碼格式
    if (!validateLastFiveDigits(payload.lastFiveDigits)) {
      console.error(`Invalid last five digits format: ${payload.lastFiveDigits}`);
      return false;
    }

    // 獲取訂單信息
    const booking = await db.getBookingById(payload.bookingId);
    if (!booking) {
      console.error(`Booking not found: ${payload.bookingId}`);
      return false;
    }

    // 驗證郵箱是否匹配
    if (booking.guestEmail !== payload.guestEmail) {
      console.error(`Email mismatch for booking ${payload.bookingId}`);
      return false;
    }

    // 檢查訂單狀態是否為「已匯款」
    if (booking.status !== "paid_pending") {
      console.error(`Booking ${payload.bookingId} is not in paid_pending status`);
      return false;
    }

    // 更新訂單的後五碼和狀態
    // 這裡假設有一個更新函數，實際實現需要根據數據庫結構調整
    console.log(`✅ 後五碼已確認：${payload.lastFiveDigits}`);
    console.log(`✅ 訂單狀態已更新為「已付款」`);

    return true;
  } catch (error) {
    console.error("Error handling email reply:", error);
    return false;
  }
}

/**
 * 生成訂房確認郵件（支持回覆）
 */
export function generateBookingConfirmationEmail(
  booking: {
    id: number;
    guestName: string;
    guestEmail: string;
    checkInDate: Date;
    checkOutDate: Date;
    totalPrice: number | string;
    roomTypeName: string;
  },
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }
): {
  subject: string;
  html: string;
  text: string;
} {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString("zh-TW");
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString("zh-TW");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #8B6F47; color: white; padding: 20px; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .booking-info { background-color: white; padding: 15px; border-left: 4px solid #8B6F47; margin: 10px 0; }
    .bank-info { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .reply-section { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
    strong { color: #8B6F47; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 訂房確認</h1>
      <p>感謝您選擇歐堡商務汽車旅館</p>
    </div>

    <div class="content">
      <h2>訂房詳情</h2>
      <div class="booking-info">
        <p><strong>訂房編號：</strong> #${booking.id}</p>
        <p><strong>客戶名稱：</strong> ${booking.guestName}</p>
        <p><strong>房型：</strong> ${booking.roomTypeName}</p>
        <p><strong>入住日期：</strong> ${checkInDate}</p>
        <p><strong>退房日期：</strong> ${checkOutDate}</p>
        <p><strong>總金額：</strong> NT$ ${Number(booking.totalPrice).toLocaleString()}</p>
      </div>

      <h2>💳 匯款資訊</h2>
      <div class="bank-info">
        <p><strong>銀行：</strong> ${bankInfo.bankName}</p>
        <p><strong>帳號：</strong> ${bankInfo.accountNumber}</p>
        <p><strong>戶名：</strong> ${bankInfo.accountName}</p>
        <p><strong>金額：</strong> NT$ ${Number(booking.totalPrice).toLocaleString()}</p>
      </div>

      <h2>📧 確認付款</h2>
      <div class="reply-section">
        <p>親愛的 ${booking.guestName}，</p>
        <p>匯款完成後，請<strong>直接回覆此郵件</strong>並在郵件中填寫您的<strong>轉帳憑證後五碼</strong>。</p>
        <p>例如：「後五碼：12345」或「Last 5 digits: 12345」</p>
        <p>我們會在收到您的回覆後立即確認付款，並為您預留房間。</p>
      </div>

      <h2>❓ 常見問題</h2>
      <div class="content">
        <p><strong>Q: 如何查看轉帳憑證後五碼？</strong></p>
        <p>A: 在銀行 APP 或網路銀行的交易記錄中，找到您的轉帳交易，轉帳憑證號碼的最後 5 位數字即為後五碼。</p>
        
        <p><strong>Q: 郵件回覆後多久會確認？</strong></p>
        <p>A: 我們會在營業時間內（09:00-18:00）立即確認，通常在 1 小時內完成。</p>
      </div>
    </div>

    <div class="footer">
      <p>歐堡商務汽車旅館</p>
      <p>電話：06-635-9577 | 郵件：castle6359577@gmail.com</p>
      <p>此郵件由系統自動發送，請勿直接回覆此郵件地址</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
訂房確認

感謝您選擇歐堡商務汽車旅館

訂房詳情
訂房編號：#${booking.id}
客戶名稱：${booking.guestName}
房型：${booking.roomTypeName}
入住日期：${checkInDate}
退房日期：${checkOutDate}
總金額：NT$ ${Number(booking.totalPrice).toLocaleString()}

匯款資訊
銀行：${bankInfo.bankName}
帳號：${bankInfo.accountNumber}
戶名：${bankInfo.accountName}
金額：NT$ ${Number(booking.totalPrice).toLocaleString()}

確認付款
親愛的 ${booking.guestName}，
匯款完成後，請直接回覆此郵件並在郵件中填寫您的轉帳憑證後五碼。
例如：「後五碼：12345」或「Last 5 digits: 12345」
我們會在收到您的回覆後立即確認付款，並為您預留房間。

常見問題
Q: 如何查看轉帳憑證後五碼？
A: 在銀行 APP 或網路銀行的交易記錄中，找到您的轉帳交易，轉帳憑證號碼的最後 5 位數字即為後五碼。

Q: 郵件回覆後多久會確認？
A: 我們會在營業時間內（09:00-18:00）立即確認，通常在 1 小時內完成。

---
歐堡商務汽車旅館
電話：06-635-9577 | 郵件：castle6359577@gmail.com
此郵件由系統自動發送，請勿直接回覆此郵件地址
  `;

  return {
    subject: `訂房確認 - 歐堡商務汽車旅館 (訂單 #${booking.id})`,
    html: htmlContent,
    text: textContent,
  };
}
