// @ts-nocheck
import nodemailer from 'nodemailer';

// LINE 官方帳號資訊
const LINE_ID = '@castle6359577';
const LINE_ADD_FRIEND_URL = 'https://line.me/R/ti/p/@castle6359577';

// 創建 SMTP 傳輸配置
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error('SMTP 配置不完整，郵件功能將不可用');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

// 郵件發送函數
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error('郵件傳輸配置失敗');
      return false;
    }

    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    console.log(`✅ 郵件已發送到 ${to}，Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ 郵件發送失敗: ${error}`);
    return false;
  }
}

// ==================== 共用郵件組件 ====================

const lineAddFriendBlock = `
  <div style="background: linear-gradient(135deg, #06C755 0%, #05a847 100%); padding: 25px; text-align: center; margin: 25px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(6, 199, 85, 0.3);">
    <div style="margin-bottom: 15px;">
      <span style="font-size: 32px;">💬</span>
    </div>
    <p style="margin: 0 0 15px 0; color: white; font-size: 16px; font-weight: 500;">
      加入官方 LINE 好友，獲得即時服務
    </p>
    <a href="${LINE_ADD_FRIEND_URL}" 
       style="display: inline-block; background: white; color: #06C755; padding: 14px 40px; 
              border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
      ➕ 加入好友
    </a>
    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
      LINE ID: <strong>${LINE_ID}</strong>
    </p>
  </div>
`;

const emailFooter = `
  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
    <div style="margin-bottom: 20px;">
      <a href="${LINE_ADD_FRIEND_URL}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #06C755; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 20px; font-weight: bold;">L</span>
        </div>
      </a>
      <a href="https://www.facebook.com/castlehoteltainan" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #1877F2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 20px; font-weight: bold;">f</span>
        </div>
      </a>
      <a href="tel:06-635-9577" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #8B7355; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 18px;">📞</span>
        </div>
      </a>
    </div>
    <p style="margin: 0 0 8px 0; color: #495057; font-size: 15px; font-weight: 600;">
      歐堡商務汽車旅館
    </p>
    <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 13px;">
      📍 台南市新營區長榮路一段41號
    </p>
    <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 13px;">
      📞 06-635-9577 ｜ ✉️ castle6359577@gmail.com
    </p>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #adb5bd; font-size: 11px;">
        © 2026 歐堡商務汽車旅館有限公司 All Rights Reserved.
      </p>
    </div>
  </div>
`;

// ==================== 訂房確認郵件 ====================
export function generateBookingConfirmationEmail(
  guestName: string,
  roomName: string,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfGuests: number,
  totalPrice: string,
  bookingId: number,
  specialRequests?: string,
  baseUrl: string = 'https://j4lgdbyk5e-tcqganzzma-uk.a.run.app'
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #8B7355 0%, #6d5a43 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <span style="font-size: 36px;">🏰</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">訂房申請已收到</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">歐堡商務汽車旅館</p>
        <div style="display: inline-block; background: #4CAF50; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; margin-top: 15px;">
          ✓ 官方網站訂房
        </div>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          親愛的 <strong style="color: #8B7355;">${guestName}</strong> 您好！
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          感謝您選擇歐堡商務汽車旅館！我們已收到您的訂房申請，以下是您的訂房詳情：
        </p>
        
        <div style="background: linear-gradient(135deg, #f8f4f0 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8B7355;">
          <h3 style="margin: 0 0 20px 0; color: #8B7355; font-size: 18px;">📋 訂房資訊</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">訂房編號</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">房型</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${roomName}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">入住日期</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${checkInFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">退房日期</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${checkOutFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">住宿晚數</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${nights} 晚</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">入住人數</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${numberOfGuests} 人</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">總金額</td><td style="padding: 12px 0; font-weight: bold; color: #8B7355; text-align: right; font-size: 18px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        ${specialRequests ? `
        <div style="background: #fff8e1; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin: 0 0 10px 0; color: #f57c00; font-size: 16px;">📝 特殊需求</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">${specialRequests}</p>
        </div>
        ` : ''}
        
        <div style="background: #e8f5e9; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 16px;">🏦 銀行轉帳資訊</h4>
          <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">請依照以下資訊進行銀行轉帳：</p>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">銀行</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">台灣銀行</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">銀行代碼</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">004</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">帳號</td><td style="padding: 8px 0; font-weight: bold; text-align: right; font-family: monospace;">123-456-789012</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">戶名</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">歐堡商務汽車旅館有限公司</td></tr>
            </table>
          </div>
          <p style="margin: 15px 0 0 0; color: #666; font-size: 13px;">
            ✅ 轉帳後請透過 LINE 或回覆郵件告知轉帳後五碼，以便我們確認付款
          </p>
        </div>
        
        ${lineAddFriendBlock}
        
        <div style="text-align: center; margin: 25px 0;">
          <p style="color: #999; font-size: 13px; margin-bottom: 15px;">需要取消訂單嗎？</p>
          <a href="${baseUrl}/cancel-booking?bookingId=${bookingId}" 
             style="display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; 
                    border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
            取消訂單
          </a>
        </div>
      </div>
      
      ${emailFooter}
    </div>
  `;
}

// ==================== 管理員通知郵件 ====================
export function generateAdminNotificationEmail(
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  roomName: string,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfGuests: number,
  totalPrice: string,
  bookingId: number,
  specialRequests?: string
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px 20px; text-align: center;">
        <div style="width: 70px; height: 70px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">🔔</span>
        </div>
        <h1 style="margin: 0; font-size: 22px; color: white; font-weight: 500;">新訂房通知</h1>
        <div style="display: inline-block; background: #4CAF50; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px;">
          ✓ 官方網站訂房
        </div>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <strong style="color: #856404;">⚠️ 新訂房申請已收到，請盡快確認</strong>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📋 訂房資訊</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">訂房編號</td><td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #ddd;">#${bookingId}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">房型</td><td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #ddd;">${roomName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">入住日期</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${checkInFormatted}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">退房日期</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${checkOutFormatted}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">住宿晚數</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${nights} 晚</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">入住人數</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${numberOfGuests} 人</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">總金額</td><td style="padding: 8px 0; font-weight: bold; color: #ff9800; text-align: right; font-size: 18px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px;">👤 客戶資訊</h3>
          <p style="margin: 0; color: #333; line-height: 1.8;">
            姓名：<strong>${guestName}</strong><br>
            電話：<a href="tel:${guestPhone}" style="color: #1976d2; text-decoration: none;">${guestPhone}</a><br>
            郵件：${guestEmail || '未提供'}
          </p>
        </div>
        
        ${specialRequests ? `
        <div style="background: #fff9e6; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <strong style="color: #856404;">📝 特殊需求：</strong>
          <p style="margin: 10px 0 0 0; color: #666;">${specialRequests}</p>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          請登入管理後台確認此訂房
        </p>
      </div>
    </div>
  `;
}

// ==================== 訂房已確認郵件 ====================
export function generateBookingConfirmedEmail(
  guestName: string,
  bookingId: number,
  roomName: string,
  checkInDate: Date,
  checkOutDate: Date,
  totalPrice: string
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">✅</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">訂房已確認</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">您的訂房已成功確認</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          親愛的 <strong style="color: #4CAF50;">${guestName}</strong> 您好！
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          恭喜！您的訂房已確認，請依照付款資訊完成付款。
        </p>
        
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin: 0 0 20px 0; color: #2e7d32; font-size: 18px;">📋 訂房資訊</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">訂房編號</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">房型</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${roomName}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">入住日期</td><td style="padding: 12px 0; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${checkInFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">退房日期</td><td style="padding: 12px 0; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${checkOutFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">總金額</td><td style="padding: 12px 0; font-weight: bold; color: #4CAF50; text-align: right; font-size: 18px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        <div style="background: #e3f2fd; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2196F3;">
          <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px;">🏦 銀行轉帳資訊</h4>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">銀行</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">台灣銀行</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">銀行代碼</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">004</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">帳號</td><td style="padding: 8px 0; font-weight: bold; text-align: right; font-family: monospace;">123-456-789012</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">戶名</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">歐堡商務汽車旅館有限公司</td></tr>
            </table>
          </div>
        </div>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}

// ==================== 付款指示郵件 ====================
export function generatePaymentInstructionEmail(
  guestName: string,
  bookingId: number,
  totalPrice: string,
  bankName: string,
  accountNumber: string,
  accountName: string
): string {
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">💳</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">付款詳情</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">請按以下方式進行銀行轉帳</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          親愛的 <strong style="color: #2196F3;">${guestName}</strong> 您好！
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          感謝您的訂房確認！請按照以下指示進行銀行轉帳：
        </p>
        
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2196F3;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #bbdefb;">訂房編號</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #bbdefb;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">應付金額</td><td style="padding: 12px 0; font-weight: bold; color: #2196F3; text-align: right; font-size: 20px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        <div style="background: #f5f5f5; padding: 25px; border-radius: 12px; margin: 25px 0;">
          <h4 style="margin: 0 0 20px 0; color: #333; font-size: 16px;">🏦 銀行轉帳資訊</h4>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">銀行名稱</td><td style="padding: 10px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${bankName}</td></tr>
              <tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">帳號</td><td style="padding: 10px 0; font-weight: bold; text-align: right; font-family: monospace; border-bottom: 1px solid #eee;">${accountNumber}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;">戶名</td><td style="padding: 10px 0; font-weight: bold; text-align: right;">${accountName}</td></tr>
            </table>
          </div>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 15px;">⚠️ 重要提醒</h4>
          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
            請在轉帳時的備註欄填寫訂房編號 <strong>#${bookingId}</strong>，以便我們快速確認您的付款。
          </p>
        </div>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}

// ==================== 付款確認郵件 ====================
export function generatePaymentConfirmedEmail(
  guestName: string,
  bookingId: number,
  totalPrice: string,
  checkInDate: Date
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">💰</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">付款已確認</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">您的付款已成功確認</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          親愛的 <strong style="color: #4CAF50;">${guestName}</strong> 您好！
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          感謝您的付款！我們已成功收到您的轉帳，訂房已確認完成。
        </p>
        
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin: 0 0 20px 0; color: #2e7d32; font-size: 18px;">✅ 確認資訊</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">訂房編號</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">已確認金額</td><td style="padding: 12px 0; font-weight: bold; color: #4CAF50; text-align: right; font-size: 18px; border-bottom: 1px solid #c8e6c9;">NT$ ${totalPrice}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">入住日期</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right;">${checkInFormatted}</td></tr>
          </table>
        </div>
        
        <div style="background: #fff8e1; padding: 20px; border-radius: 12px; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #f57c00; font-size: 16px;">⏰ 入住須知</h4>
          <div style="color: #666; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 8px 0;">✓ 入住時間：下午 3:00（15:00）起</p>
            <p style="margin: 0 0 8px 0;">✓ 退房時間：隔日中午 12:00 前</p>
            <p style="margin: 0;">✓ 如需提前入住或延遲退房，請提前聯繫我們</p>
          </div>
        </div>
        
        ${lineAddFriendBlock}
        
        <p style="color: #666; line-height: 1.8; font-size: 15px; text-align: center; margin-top: 30px;">
          我們期待您的到來！🌟
        </p>
      </div>
      
      ${emailFooter}
    </div>
  `;
}

// ==================== 訂房完成郵件 ====================
export function generateBookingCompletedEmail(
  guestName: string,
  bookingId: number,
  checkOutDate: Date
): string {
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">🎉</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">感謝您的入住</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">期待再次為您服務</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          親愛的 <strong style="color: #9C27B0;">${guestName}</strong> 您好！
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          感謝您選擇歐堡商務汽車旅館！希望您在我們這裡度過了愉快的時光。
        </p>
        
        <div style="background: linear-gradient(135deg, #f3e5f5 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #9C27B0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #e1bee7;">訂房編號</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #e1bee7;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">退房日期</td><td style="padding: 12px 0; color: #333; text-align: right;">${checkOutFormatted}</td></tr>
          </table>
        </div>
        
        <div style="background: linear-gradient(135deg, #fff9c4 0%, #fff 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px dashed #ffc107;">
          <h3 style="margin: 0 0 10px 0; color: #f57f17; font-size: 20px;">🎁 專屬回饋優惠</h3>
          <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">感謝您的入住，下次訂房可享專屬優惠！</p>
          <div style="background: #9C27B0; color: white; padding: 20px 30px; border-radius: 10px; display: inline-block;">
            <p style="margin: 0 0 5px 0; font-size: 14px;">優惠碼</p>
            <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px;">THANKYOU10</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;">享 <strong>9 折</strong> 優惠</p>
          </div>
        </div>
        
        <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; color: #e65100; font-size: 18px;">⭐ 您的意見很重要</h3>
          <p style="color: #666; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
            如果您對我們的服務滿意，歡迎在 Google 評論給我們五星好評！
          </p>
          <a href="https://g.page/r/CastleHotelTainan/review" 
             style="display: inline-block; background: #4285f4; color: white; padding: 12px 30px; 
                    border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
            ⭐ 前往評價
          </a>
        </div>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}

// ==================== 訂房取消郵件 ====================
export function generateBookingCancelledEmail(
  guestName: string,
  bookingId: number,
  reason?: string
): string {
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">❌</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">訂房已取消</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">您的訂房已被取消</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          親愛的 <strong style="color: #f44336;">${guestName}</strong> 您好！
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          您的訂房已被取消。以下是取消詳情：
        </p>
        
        <div style="background: linear-gradient(135deg, #ffebee 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f44336;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #ffcdd2;">訂房編號</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #ffcdd2;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; ${reason ? 'border-bottom: 1px solid #ffcdd2;' : ''}">狀態</td><td style="padding: 12px 0; font-weight: bold; color: #f44336; text-align: right; ${reason ? 'border-bottom: 1px solid #ffcdd2;' : ''}">已取消</td></tr>
            ${reason ? `<tr><td style="padding: 12px 0; color: #888; font-size: 14px;">取消原因</td><td style="padding: 12px 0; color: #333; text-align: right;">${reason}</td></tr>` : ''}
          </table>
        </div>
        
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          如有任何問題或需要重新預訂，歡迎隨時聯絡我們。
        </p>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}
