import * as db from "./db";
import { sendEmail } from "./_core/email";

/**
 * 自動提醒調度器
 * 處理入住前一天提醒、付款逾期提醒、退房感謝郵件
 */

// LINE 官方帳號資訊
const LINE_ID = '@castle6359577';
const LINE_ADD_FRIEND_URL = 'https://line.me/R/ti/p/@castle6359577';

// 共用的郵件頁首
const emailHeader = `
  <div style="background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); padding: 40px 20px; text-align: center;">
    <div style="max-width: 120px; margin: 0 auto 15px;">
      <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <span style="font-size: 36px; color: #8B7355; font-weight: bold;">E</span>
      </div>
    </div>
    <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 300; letter-spacing: 2px;">歐堡商務汽車旅館</h1>
    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px; letter-spacing: 3px;">EUROPEAN CASTLE HOTEL</p>
  </div>
`;

// 共用的 LINE 加好友區塊
const lineAddFriendBlock = `
  <div style="background: #06C755; padding: 25px; text-align: center; margin: 25px 0; border-radius: 12px;">
    <p style="margin: 0 0 15px 0; color: white; font-size: 16px; font-weight: 500;">
      📱 加入官方 LINE 好友，獲得即時服務
    </p>
    <a href="${LINE_ADD_FRIEND_URL}" 
       style="display: inline-block; background: white; color: #06C755; padding: 14px 40px; 
              border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s;">
      <span style="vertical-align: middle;">🔗</span> 加入好友
    </a>
    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
      LINE ID: ${LINE_ID}
    </p>
  </div>
`;

// 共用的郵件頁尾
const emailFooter = `
  <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
    <div style="margin-bottom: 20px;">
      <a href="${LINE_ADD_FRIEND_URL}" style="display: inline-block; margin: 0 8px;">
        <div style="width: 40px; height: 40px; background: #06C755; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 18px;">L</span>
        </div>
      </a>
      <a href="https://www.facebook.com/castlehoteltainan" style="display: inline-block; margin: 0 8px;">
        <div style="width: 40px; height: 40px; background: #1877F2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 18px;">f</span>
        </div>
      </a>
    </div>
    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
      <strong>歐堡商務汽車旅館</strong>
    </p>
    <p style="margin: 0 0 5px 0; color: #888; font-size: 13px;">
      📍 台南市新營區長榮路一段41號
    </p>
    <p style="margin: 0 0 5px 0; color: #888; font-size: 13px;">
      📞 06-635-9577 ｜ ✉️ castle6359577@gmail.com
    </p>
    <p style="margin: 15px 0 0 0; color: #aaa; font-size: 11px;">
      © 2026 歐堡商務汽車旅館有限公司 All Rights Reserved.
    </p>
  </div>
`;

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
    subject: '🏨【明日入住提醒】歐堡商務汽車旅館期待您的到來',
    html: `
      <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        ${emailHeader}
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px;">🎉</span>
            <h2 style="margin: 15px 0 0 0; color: #333; font-size: 24px; font-weight: 500;">明日入住提醒</h2>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            親愛的 <strong style="color: #8B7355;">${booking.guestName}</strong> 您好！
          </p>
          
          <p style="color: #666; line-height: 1.8; font-size: 15px;">
            感謝您選擇歐堡商務汽車旅館！提醒您，您的入住日期是<strong style="color: #8B7355;">明天</strong>，我們已為您準備好舒適的房間，期待您的到來！
          </p>
          
          <div style="background: linear-gradient(135deg, #f8f4f0 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8B7355;">
            <h3 style="margin: 0 0 20px 0; color: #8B7355; font-size: 18px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📋</span> 訂單資訊
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">訂單編號</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">入住日期</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${new Date(booking.checkInDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">退房日期</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${new Date(booking.checkOutDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</td>
              </tr>
              ${booking.roomTypeName ? `
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px;">房型</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right;">${booking.roomTypeName}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background: #fff8e1; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h4 style="margin: 0 0 15px 0; color: #f57c00; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">⏰</span> 入住須知
            </h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                <span style="margin-right: 10px;">✓</span> 入住時間：下午 3:00（15:00）起
              </div>
              <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                <span style="margin-right: 10px;">✓</span> 退房時間：隔日中午 12:00 前
              </div>
              <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                <span style="margin-right: 10px;">✓</span> 如需提前入住或延遲退房，請提前聯繫我們
              </div>
            </div>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📍</span> 交通資訊
            </h4>
            <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.8;">
              地址：台南市新營區長榮路一段41號<br>
              <a href="https://maps.google.com/?q=台南市新營區長榮路一段41號" style="color: #1976d2; text-decoration: none;">📍 點此開啟 Google 地圖導航</a>
            </p>
          </div>
          
          ${lineAddFriendBlock}
          
          <p style="color: #666; line-height: 1.8; font-size: 15px; text-align: center; margin-top: 30px;">
            如有任何問題，歡迎隨時與我們聯繫！<br>
            我們期待您的到來 🌟
          </p>
        </div>
        
        ${emailFooter}
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
    subject: '⚠️【付款提醒】請盡快完成付款 - 歐堡商務汽車旅館',
    html: `
      <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); padding: 40px 20px; text-align: center;">
          <div style="max-width: 120px; margin: 0 auto 15px;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <span style="font-size: 36px;">⚠️</span>
            </div>
          </div>
          <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 500;">付款提醒</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">請盡快完成付款以確保訂房有效</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            親愛的 <strong style="color: #ee5a5a;">${booking.guestName}</strong> 您好！
          </p>
          
          <p style="color: #666; line-height: 1.8; font-size: 15px;">
            我們注意到您的訂單尚未完成付款。為確保您的訂房有效，請盡快完成付款。
          </p>
          
          <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ff9800;">
            <h3 style="margin: 0 0 20px 0; color: #e65100; font-size: 18px;">
              📋 訂單資訊
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #ffe0b2;">訂單編號</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #ffe0b2;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #ffe0b2;">入住日期</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #ffe0b2;">${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px;">應付金額</td>
                <td style="padding: 12px 0; font-weight: bold; color: #ee5a5a; text-align: right; font-size: 20px;">NT$ ${booking.totalPrice}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #f5f5f5; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h4 style="margin: 0 0 20px 0; color: #333; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">💳</span> 付款方式：銀行轉帳
            </h4>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">銀行名稱</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">台灣銀行</td>
              </tr>
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">銀行代碼</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">004</td>
              </tr>
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">帳號</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee; font-family: monospace; letter-spacing: 1px;">123-456-789012</td>
              </tr>
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px;">戶名</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right;">歐堡商務汽車旅館有限公司</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ffebee; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; color: #c62828; font-weight: bold; font-size: 15px;">
              ⏰ 請於入住前完成付款，以確保您的訂房有效
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.8; font-size: 14px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
            💡 <strong>溫馨提示：</strong>完成轉帳後，請透過 LINE 或電話告知我們轉帳帳號後五碼，以便我們確認您的付款。
          </p>
          
          ${lineAddFriendBlock}
        </div>
        
        ${emailFooter}
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
    subject: '💝【感謝入住】期待再次相見 - 歐堡商務汽車旅館',
    html: `
      <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 20px; text-align: center;">
          <div style="max-width: 120px; margin: 0 auto 15px;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <span style="font-size: 36px;">🙏</span>
            </div>
          </div>
          <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 500;">感謝您的入住</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">期待再次為您服務</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            親愛的 <strong style="color: #4CAF50;">${booking.guestName}</strong> 您好！
          </p>
          
          <p style="color: #666; line-height: 1.8; font-size: 15px;">
            感謝您選擇歐堡商務汽車旅館！希望您在我們這裡度過了愉快的時光。您的滿意是我們最大的榮幸！
          </p>
          
          <div style="background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin: 0 0 20px 0; color: #2e7d32; font-size: 18px;">
              📋 入住紀錄
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">訂單編號</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">入住日期</td>
                <td style="padding: 12px 0; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px;">退房日期</td>
                <td style="padding: 12px 0; color: #333; text-align: right;">${new Date(booking.checkOutDate).toLocaleDateString('zh-TW')}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: linear-gradient(135deg, #fff9c4 0%, #fff 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px dashed #ffc107;">
            <h3 style="margin: 0 0 10px 0; color: #f57f17; font-size: 20px;">🎁 專屬回饋優惠</h3>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">感謝您的入住，下次訂房可享專屬優惠！</p>
            <div style="background: #4CAF50; color: white; padding: 20px 30px; border-radius: 10px; display: inline-block;">
              <p style="margin: 0 0 5px 0; font-size: 14px;">優惠碼</p>
              <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px;">THANKYOU10</p>
              <p style="margin: 10px 0 0 0; font-size: 16px;">享 <strong>9 折</strong> 優惠</p>
            </div>
            <p style="color: #888; margin: 15px 0 0 0; font-size: 12px;">* 訂房時請告知此優惠碼</p>
          </div>
          
          <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #e65100; font-size: 18px;">⭐ 您的意見很重要</h3>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
              如果您對我們的服務滿意，歡迎在 Google 評論給我們五星好評！<br>
              您的支持是我們進步的動力 💪
            </p>
            <a href="https://g.page/r/CastleHotelTainan/review" 
               style="display: inline-block; background: #4285f4; color: white; padding: 12px 30px; 
                      border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
              ⭐ 前往評價
            </a>
          </div>
          
          ${lineAddFriendBlock}
          
          <p style="color: #666; line-height: 1.8; font-size: 15px; text-align: center; margin-top: 30px;">
            期待下次再為您服務！<br>
            祝您旅途愉快 🌟
          </p>
        </div>
        
        ${emailFooter}
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
