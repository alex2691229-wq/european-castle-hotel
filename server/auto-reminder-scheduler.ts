import * as db from "./db";
import { sendEmail } from "./_core/email";

/**
 * 自動提醒調度器
 * 處理入住前一天提醒、付款逾期提醒、退房感謝郵件
 */

// 郵件模板
const emailTemplates = {
  // 入住前一天提醒郵件
  checkInReminder: (booking: {
    id: number;
    guestName: string;
    checkInDate: Date | string;
    checkOutDate: Date | string;
    roomTypeName?: string;
    totalPrice?: string | number;
  }) => ({
    subject: '【明日入住提醒】歐堡商務汽車旅館',
    html: `
      <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🏨 歐堡商務汽車旅館</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">明日入住提醒</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">親愛的 <strong>${booking.guestName}</strong>，您好！</p>
          
          <p style="color: #666; line-height: 1.8;">
            感謝您選擇歐堡商務汽車旅館！提醒您，您的入住日期是<strong>明天</strong>，我們已為您準備好舒適的房間。
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B7355;">
            <h3 style="margin: 0 0 15px 0; color: #8B7355;">📋 訂單資訊</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">訂單編號：</td><td style="padding: 8px 0; font-weight: bold;">#${booking.id}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">入住日期：</td><td style="padding: 8px 0; font-weight: bold;">${new Date(booking.checkInDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">退房日期：</td><td style="padding: 8px 0; font-weight: bold;">${new Date(booking.checkOutDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</td></tr>
              ${booking.roomTypeName ? `<tr><td style="padding: 8px 0; color: #666;">房型：</td><td style="padding: 8px 0; font-weight: bold;">${booking.roomTypeName}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⏰ 入住須知</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>入住時間：下午 3:00（15:00）起</li>
              <li>退房時間：隔日中午 12:00 前</li>
              <li>如需提前入住或延遲退房，請提前聯繫我們</li>
            </ul>
          </div>
          
          <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">📍 交通資訊</h4>
            <p style="margin: 0; color: #0c5460;">
              地址：台南市新營區長榮路一段41號<br>
              電話：06-635-9577
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.8;">
            我們期待您的到來！如有任何問題，請隨時與我們聯繫。
          </p>
          
          <p style="color: #666; margin-top: 30px;">
            歐堡商務汽車旅館 敬上<br>
            <small style="color: #999;">European Castle Hotel</small>
          </p>
        </div>
      </div>
    `,
  }),

  // 付款逾期提醒郵件（24小時）
  paymentOverdue: (booking: {
    id: number;
    guestName: string;
    checkInDate: Date | string;
    totalPrice?: string | number;
    createdAt: Date | string;
  }) => ({
    subject: '【付款提醒】請盡快完成付款 - 歐堡商務汽車旅館',
    html: `
      <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ 付款提醒</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">歐堡商務汽車旅館</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">親愛的 <strong>${booking.guestName}</strong>，您好！</p>
          
          <p style="color: #666; line-height: 1.8;">
            我們注意到您的訂單尚未完成付款。為確保您的訂房有效，請盡快完成付款。
          </p>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">📋 訂單資訊</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">訂單編號：</td><td style="padding: 8px 0; font-weight: bold;">#${booking.id}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">入住日期：</td><td style="padding: 8px 0; font-weight: bold;">${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">應付金額：</td><td style="padding: 8px 0; font-weight: bold; color: #dc3545;">NT$ ${booking.totalPrice}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">訂單建立時間：</td><td style="padding: 8px 0;">${new Date(booking.createdAt).toLocaleString('zh-TW')}</td></tr>
            </table>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
            <h4 style="margin: 0 0 15px 0; color: #333;">💳 付款方式：銀行轉帳</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">銀行名稱：</td><td style="padding: 8px 0; font-weight: bold;">台灣銀行</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">銀行代碼：</td><td style="padding: 8px 0; font-weight: bold;">004</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">帳號：</td><td style="padding: 8px 0; font-weight: bold;">123-456-789012</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">戶名：</td><td style="padding: 8px 0; font-weight: bold;">歐堡商務汽車旅館有限公司</td></tr>
            </table>
          </div>
          
          <p style="color: #dc3545; font-weight: bold; text-align: center; padding: 15px; background: #f8d7da; border-radius: 8px;">
            ⏰ 請於入住前完成付款，以確保您的訂房有效
          </p>
          
          <p style="color: #666; line-height: 1.8; margin-top: 20px;">
            完成轉帳後，請回覆此郵件或致電告知我們轉帳帳號後五碼，以便我們確認您的付款。
          </p>
          
          <p style="color: #666; margin-top: 30px;">
            如有任何問題，請聯繫我們：<br>
            電話：06-635-9577<br>
            Email：castle6359577@gmail.com
          </p>
          
          <p style="color: #666; margin-top: 30px;">
            歐堡商務汽車旅館 敬上
          </p>
        </div>
      </div>
    `,
  }),

  // 退房感謝郵件
  checkOutThankYou: (booking: {
    id: number;
    guestName: string;
    checkInDate: Date | string;
    checkOutDate: Date | string;
    roomTypeName?: string;
  }) => ({
    subject: '【感謝入住】期待再次相見 - 歐堡商務汽車旅館',
    html: `
      <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🙏 感謝您的入住</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">歐堡商務汽車旅館</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">親愛的 <strong>${booking.guestName}</strong>，您好！</p>
          
          <p style="color: #666; line-height: 1.8;">
            感謝您選擇歐堡商務汽車旅館！希望您在我們這裡度過了愉快的時光。
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #28a745;">📋 入住紀錄</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">訂單編號：</td><td style="padding: 8px 0; font-weight: bold;">#${booking.id}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">入住日期：</td><td style="padding: 8px 0;">${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">退房日期：</td><td style="padding: 8px 0;">${new Date(booking.checkOutDate).toLocaleDateString('zh-TW')}</td></tr>
              ${booking.roomTypeName ? `<tr><td style="padding: 8px 0; color: #666;">房型：</td><td style="padding: 8px 0;">${booking.roomTypeName}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #2e7d32;">💝 專屬優惠</h3>
            <p style="color: #2e7d32; margin: 0;">
              下次入住可享 <strong style="font-size: 24px;">9折</strong> 優惠！<br>
              <small>請於訂房時告知此優惠碼：THANKYOU10</small>
            </p>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #e65100;">⭐ 您的意見很重要</h3>
            <p style="color: #666; margin: 0;">
              如果您對我們的服務滿意，歡迎在 Google 評論給我們五星好評！<br>
              您的支持是我們進步的動力。
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.8;">
            期待下次再為您服務！祝您旅途愉快！
          </p>
          
          <p style="color: #666; margin-top: 30px;">
            歐堡商務汽車旅館 全體同仁 敬上<br>
            <small style="color: #999;">European Castle Hotel</small><br><br>
            📍 台南市新營區長榮路一段41號<br>
            📞 06-635-9577<br>
            ✉️ castle6359577@gmail.com
          </p>
        </div>
      </div>
    `,
  }),
};

/**
 * 獲取明天入住的訂單（已付款或現場付款）
 */
export async function getTomorrowCheckInBookings() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const allBookings = await db.getAllBookings();
  return allBookings.filter(b => {
    const checkInDate = new Date(b.checkInDate).toISOString().split('T')[0];
    return checkInDate === tomorrowStr && 
           (b.status === 'paid' || b.status === 'cash_on_site' || b.status === 'confirmed');
  });
}

/**
 * 獲取超過 24 小時未付款的訂單
 */
export async function getOverdue24HoursPaymentBookings() {
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const allBookings = await db.getAllBookings();
  return allBookings.filter(b => 
    b.status === 'pending_payment' && 
    new Date(b.updatedAt || b.createdAt) < oneDayAgo
  );
}

/**
 * 獲取今天退房的訂單（已完成）
 */
export async function getTodayCheckOutBookings() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const allBookings = await db.getAllBookings();
  return allBookings.filter(b => {
    const checkOutDate = new Date(b.checkOutDate).toISOString().split('T')[0];
    return checkOutDate === todayStr && b.status === 'completed';
  });
}

/**
 * 發送入住前一天提醒郵件
 */
export async function sendCheckInReminders() {
  const bookings = await getTomorrowCheckInBookings();
  const results: { bookingId: number; success: boolean; error?: string }[] = [];

  for (const booking of bookings) {
    try {
      if (booking.guestEmail) {
        const template = emailTemplates.checkInReminder(booking);
        await sendEmail(booking.guestEmail, template.subject, template.html);
        results.push({ bookingId: booking.id, success: true });
        console.log(`[AutoReminder] 入住提醒已發送: 訂單 #${booking.id}`);
      } else {
        results.push({ bookingId: booking.id, success: false, error: '無客戶郵箱' });
      }
    } catch (error) {
      console.error(`[AutoReminder] 發送入住提醒失敗: 訂單 #${booking.id}`, error);
      results.push({ bookingId: booking.id, success: false, error: String(error) });
    }
  }

  return { type: 'checkInReminder', total: bookings.length, results };
}

/**
 * 發送付款逾期提醒郵件
 */
export async function sendPaymentOverdueReminders() {
  const bookings = await getOverdue24HoursPaymentBookings();
  const results: { bookingId: number; success: boolean; error?: string }[] = [];

  for (const booking of bookings) {
    try {
      if (booking.guestEmail) {
        const template = emailTemplates.paymentOverdue(booking);
        await sendEmail(booking.guestEmail, template.subject, template.html);
        results.push({ bookingId: booking.id, success: true });
        console.log(`[AutoReminder] 付款提醒已發送: 訂單 #${booking.id}`);
      } else {
        results.push({ bookingId: booking.id, success: false, error: '無客戶郵箱' });
      }
    } catch (error) {
      console.error(`[AutoReminder] 發送付款提醒失敗: 訂單 #${booking.id}`, error);
      results.push({ bookingId: booking.id, success: false, error: String(error) });
    }
  }

  return { type: 'paymentOverdue', total: bookings.length, results };
}

/**
 * 發送退房感謝郵件
 */
export async function sendCheckOutThankYouEmails() {
  const bookings = await getTodayCheckOutBookings();
  const results: { bookingId: number; success: boolean; error?: string }[] = [];

  for (const booking of bookings) {
    try {
      if (booking.guestEmail) {
        const template = emailTemplates.checkOutThankYou(booking);
        await sendEmail(booking.guestEmail, template.subject, template.html);
        results.push({ bookingId: booking.id, success: true });
        console.log(`[AutoReminder] 感謝郵件已發送: 訂單 #${booking.id}`);
      } else {
        results.push({ bookingId: booking.id, success: false, error: '無客戶郵箱' });
      }
    } catch (error) {
      console.error(`[AutoReminder] 發送感謝郵件失敗: 訂單 #${booking.id}`, error);
      results.push({ bookingId: booking.id, success: false, error: String(error) });
    }
  }

  return { type: 'checkOutThankYou', total: bookings.length, results };
}

/**
 * 執行所有自動提醒任務
 * 建議每天執行一次（早上 9:00）
 */
export async function runAllAutoReminders() {
  console.log('[AutoReminder] 開始執行自動提醒任務...');
  const startTime = new Date();

  const results = {
    checkInReminder: await sendCheckInReminders(),
    paymentOverdue: await sendPaymentOverdueReminders(),
    checkOutThankYou: await sendCheckOutThankYouEmails(),
    executedAt: startTime.toISOString(),
    duration: Date.now() - startTime.getTime(),
  };

  console.log('[AutoReminder] 自動提醒任務完成:', JSON.stringify(results, null, 2));
  return results;
}

export { emailTemplates };
