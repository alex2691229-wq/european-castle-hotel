import cron from 'node-cron';
import * as db from '../db.js';
import { sendEmail } from '../_core/email.js';

// 提醒郵件模板
function generatePendingConfirmationReminder(guestName: string, bookingId: number, checkInDate: Date): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .reminder-box { background-color: #fff3e0; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0; border-radius: 4px; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ 訂房確認提醒</h1>
          <p>您有待確認的訂房</p>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>我們收到您的訂房申請，但尚未收到您的確認。請盡快確認您的訂房。</p>
          
          <div class="reminder-box">
            <p><strong>訂房編號：</strong>#${bookingId}</p>
            <p><strong>入住日期：</strong>${checkInDate.toLocaleDateString('zh-TW')}</p>
            <p><strong>狀態：</strong>待確認</p>
          </div>
          
          <p>請點擊下方連結確認您的訂房：</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://european-castle-hotel.manus.space/booking-tracking?bookingId=${bookingId}" style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">確認訂房</a>
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </html>
  `;
}

function generatePaymentReminderEmail(guestName: string, bookingId: number, totalPrice: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .payment-box { background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0; border-radius: 4px; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 付款提醒</h1>
          <p>您有待付款的訂房</p>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>您的訂房已確認，請盡快完成付款。</p>
          
          <div class="payment-box">
            <p><strong>訂房編號：</strong>#${bookingId}</p>
            <p><strong>應付金額：</strong>${totalPrice}</p>
            <p><strong>狀態：</strong>待付款</p>
          </div>
          
          <p>請點擊下方連結查看付款詳情並提交轉帳後五碼：</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://european-castle-hotel.manus.space/booking-tracking?bookingId=${bookingId}" style="background-color: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">提交付款</a>
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </html>
  `;
}

// 每日 9:00 發送待確認提醒
export function scheduleConfirmationReminders() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] 執行待確認訂房提醒任務...');
    try {
      const pendingBookings = await db.getAllBookings();
      const confirmationPending = pendingBookings.filter((b: any) => b.status === 'pending');
      
      for (const booking of confirmationPending) {
        if (booking.guestEmail) {
          const emailHtml = generatePendingConfirmationReminder(
            booking.guestName,
            booking.id,
            booking.checkInDate
          );
          await sendEmail(
            booking.guestEmail,
            `訂房確認提醒 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`,
            emailHtml
          );
        }
      }
      console.log(`[Scheduler] ✅ 已發送 ${confirmationPending.length} 封待確認提醒郵件`);
    } catch (error) {
      console.error('[Scheduler] ❌ 待確認提醒任務失敗:', error);
    }
  });
}

// 每日 9:00 發送待付款提醒
export function schedulePaymentReminders() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] 執行待付款訂房提醒任務...');
    try {
      const allBookings = await db.getAllBookings();
      const paymentPending = allBookings.filter((b: any) => b.status === 'pending_payment');
      
      for (const booking of paymentPending) {
        if (booking.guestEmail) {
          const emailHtml = generatePaymentReminderEmail(
            booking.guestName,
            booking.id,
            booking.totalPrice
          );
          await sendEmail(
            booking.guestEmail,
            `付款提醒 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`,
            emailHtml
          );
        }
      }
      console.log(`[Scheduler] ✅ 已發送 ${paymentPending.length} 封待付款提醒郵件`);
    } catch (error) {
      console.error('[Scheduler] ❌ 待付款提醒任務失敗:', error);
    }
  });
}

// 每日 9:00 發送入住前 1 天提醒
export function scheduleCheckInReminders() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] 執行入住提醒任務...');
    try {
      const allBookings = await db.getAllBookings();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const checkInTomorrow = allBookings.filter((b: any) => {
        const checkInDate = new Date(b.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate.getTime() === tomorrow.getTime() && b.status === 'paid';
      });
      
      for (const booking of checkInTomorrow) {
        if (booking.guestEmail) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
                .checkin-box { background-color: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0; border-radius: 4px; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏨 入住提醒</h1>
                  <p>您即將入住我們的旅館</p>
                </div>
                
                <div class="content">
                  <p>親愛的 ${booking.guestName} 您好，</p>
                  <p>您的訂房即將在明天入住。請準時到達，我們已為您準備好房間。</p>
                  
                  <div class="checkin-box">
                    <p><strong>訂房編號：</strong>#${booking.id}</p>
                    <p><strong>入住日期：</strong>${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</p>
                    <p><strong>預計入住時間：</strong>下午 3:00 起</p>
                  </div>
                  
                  <p>如有任何問題，歡迎隨時聯絡我們。</p>
                  
                  <div class="footer">
                    <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
                  </div>
                </div>
              </div>
            </html>
          `;
          await sendEmail(
            booking.guestEmail,
            `入住提醒 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`,
            emailHtml
          );
        }
      }
      console.log(`[Scheduler] ✅ 已發送 ${checkInTomorrow.length} 封入住提醒郵件`);
    } catch (error) {
      console.error('[Scheduler] ❌ 入住提醒任務失敗:', error);
    }
  });
}

// 初始化所有調度器
export function initializeSchedulers() {
  console.log('[Scheduler] 初始化自動提醒調度器...');
  console.log('[Scheduler] ⏰ 設置每日 09:00 執行所有自動提醒任務');
  scheduleConfirmationReminders();
  schedulePaymentReminders();
  scheduleCheckInReminders();
  console.log('[Scheduler] ✅ 調度器已初始化完成');
}
