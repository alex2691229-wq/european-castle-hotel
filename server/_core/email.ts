import nodemailer from 'nodemailer';

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
    secure: port === 465, // true for 465, false for other ports
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
      text: text || html.replace(/<[^>]*>/g, ''), // 簡單的 HTML 轉文本
    });

    console.log(`✅ 郵件已發送到 ${to}，Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ 郵件發送失敗: ${error}`);
    return false;
  }
}

// 生成訂房確認郵件 HTML
export function generateBookingConfirmationEmail(
  guestName: string,
  roomName: string,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfGuests: number,
  totalPrice: string,
  bookingId: number,
  specialRequests?: string
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Microsoft YaHei', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #d4af37;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .source-badge {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        .source-badge {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .booking-details {
          background-color: #f5f5f5;
          padding: 20px;
          border-left: 4px solid #d4af37;
          margin: 20px 0;
          border-radius: 4px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #666;
        }
        .detail-value {
          color: #333;
        }
        .booking-id {
          background-color: #e8e8e8;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          margin: 10px 0;
        }
        .special-requests {
          background-color: #fff9e6;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-radius: 4px;
          margin-top: 20px;
        }
        .contact-info {
          margin: 15px 0;
          padding: 15px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
        .button {
          display: inline-block;
          background-color: #d4af37;
          color: #1a1a1a;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏰 歐堡商務汽車旅館</h1>
          <p>EUROPEAN CASTLE HOTEL</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>親愛的 ${guestName} 您好，</p>
            <p>感謝您選擇歐堡商務汽車旅館！我們已收到您的訂房申請，訂房確認詳情如下：</p>
          </div>
          
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">房型：</span>
              <span class="detail-value">${roomName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">入住日期：</span>
              <span class="detail-value">${checkInFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">退房日期：</span>
              <span class="detail-value">${checkOutFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">住宿晚數：</span>
              <span class="detail-value">${nights} 晚</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">入住人數：</span>
              <span class="detail-value">${numberOfGuests} 人</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">總金額：</span>
              <span class="detail-value" style="color: #d4af37; font-weight: bold;">NT$ ${totalPrice}</span>
            </div>
          </div>
          
          ${specialRequests ? `
            <div class="special-requests">
              <strong>特殊需求：</strong>
              <p>${specialRequests}</p>
            </div>
          ` : ''}
          
          <div class="contact-info">
            <strong>📞 聯絡資訊</strong>
            <p>
              電話：06-635-9577<br>
              郵件：castle6359577@gmail.com<br>
              地址：台南市新營區長榮路一段41號
            </p>
          </div>
          
          <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #2e7d32; font-size: 16px;">🏦 銀行轉帳資訊</strong>
            <p style="margin: 15px 0 10px 0; color: #333;">
              感謝您的訂房！請依照以下資訊進行銀行轉帳：
            </p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
              <p style="margin: 8px 0; color: #333;">
                <strong>銀行：</strong>台灣銀行<br>
                <strong>銀行代碼：</strong>004<br>
                <strong>帳號：</strong>028001003295<br>
                <strong>帳戶名：</strong>歐堡商務汽車旅館有限公司
              </p>
            </div>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">
              ✅ 轉帳時請在備註欄填寫你的訂房編號：<strong>#${bookingId}</strong>，以便我們快速對帳。
            </p>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">
              ✅ 轉帳後，請在訂房追蹤頁面填寫轉帳的後五碼，以便我們確認收款。
            </p>
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            我們將在 24 小時內確認您的訂房。如有任何問題，歡迎透過 LINE 或電話聯絡我們。
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 15px; color: #666;">需要取消訂單嗎？</p>
            <a href="https://3000-i6tfff90fhdcsut2i9gdb-8dc5f50d.sg1.manus.computer/cancel-booking?bookingId=${bookingId}" class="button" style="background-color: #e74c3c; display: inline-block; padding: 12px 30px; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">取消訂單</a>
          </div>
          
          <div class="footer">
            <p>
              © 2026 歐堡商務汽車旅館有限公司<br>
              此郵件由系統自動發送，請勿直接回覆。
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 生成管理員通知郵件 HTML
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
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Microsoft YaHei', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .header {
          background: linear-gradient(135deg, #d4af37 0%, #b8941e 100%);
          color: #1a1a1a;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .alert {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .booking-details {
          background-color: #f5f5f5;
          padding: 20px;
          border-left: 4px solid #d4af37;
          margin: 20px 0;
          border-radius: 4px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #666;
        }
        .detail-value {
          color: #333;
        }
        .guest-info {
          background-color: #e8f4f8;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-radius: 4px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
         <div class="header">
        <h1>🔔 新訂房通知</h1>
        <p>新訂房申請已收到</p>
        <div class="source-badge">✓ 官方網站訂房</div>
      </div>v class="content">
          <div class="alert">
            ⚠️ <strong>新訂房申請已收到</strong>
          </div>
          
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">房型：</span>
              <span class="detail-value">${roomName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">入住日期：</span>
              <span class="detail-value">${checkInFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">退房日期：</span>
              <span class="detail-value">${checkOutFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">住宿晚數：</span>
              <span class="detail-value">${nights} 晚</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">入住人數：</span>
              <span class="detail-value">${numberOfGuests} 人</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">總金額：</span>
              <span class="detail-value" style="color: #d4af37; font-weight: bold;">NT$ ${totalPrice}</span>
            </div>
          </div>
          
          <div class="guest-info">
            <strong>👤 客戶資訊</strong>
            <p>
              姓名：${guestName}<br>
              電話：${guestPhone}<br>
              郵件：${guestEmail || '未提供'}
            </p>
          </div>
          
          ${specialRequests ? `
            <div style="background-color: #fff9e6; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107;">
              <strong>📝 特殊需求：</strong>
              <p>${specialRequests}</p>
            </div>
          ` : ''}
          
          <p style="margin: 20px 0; color: #666;">
            請登入管理後台確認此訂房，或直接聯絡客戶進行確認。
          </p>
          
          <div class="footer">
            <p>
              此郵件由系統自動發送，請勿直接回覆。
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}


// 生成訂房確認郵件（狀態：已確認）
export function generateBookingConfirmedEmail(
  guestName: string,
  bookingId: number,
  roomName: string,
  checkInDate: Date,
  checkOutDate: Date,
  totalPrice: string
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-badge { display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .booking-details { background-color: #f5f5f5; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
        .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ 訂房已確認</h1>
          <p>您的訂房已成功確認</p>
          <div class="success-badge">✓ 官方網站訂房</div>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>恭喜！您的訂房已確認，以下是確認詳情：</p>
          
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">房型：</span>
              <span class="detail-value">${roomName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">入住日期：</span>
              <span class="detail-value">${checkInFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">退房日期：</span>
              <span class="detail-value">${checkOutFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">總金額：</span>
              <span class="detail-value" style="color: #4CAF50; font-weight: bold;">NT$ ${totalPrice}</span>
            </div>
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            下一步，請進行付款。我們接受銀行轉帳付款。
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 生成銀行轉帳通知郵件（狀態：已匯款）
export function generatePaymentInstructionEmail(
  guestName: string,
  bookingId: number,
  totalPrice: string,
  bankName: string,
  accountNumber: string,
  accountName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .payment-badge { display: inline-block; background-color: #2196F3; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .payment-info { background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; border-radius: 4px; }
        .bank-details { background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
        .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 付款詳情</h1>
          <p>請按以下方式進行銀行轉帳</p>
          <div class="payment-badge">🏦 銀行轉帳</div>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>感謝您的訂房確認！以下是付款詳情，請按照指示進行銀行轉帳：</p>
          
          <div class="payment-info">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">應付金額：</span>
              <span class="detail-value" style="color: #2196F3; font-weight: bold;">NT$ ${totalPrice}</span>
            </div>
          </div>
          
          <h3 style="color: #1976D2; margin-top: 25px;">銀行轉帳資訊</h3>
          <div class="bank-details">
            <div class="detail-row">
              <span class="detail-label">銀行名稱：</span>
              <span class="detail-value">${bankName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">帳號：</span>
              <span class="detail-value">${accountNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">帳戶名：</span>
              <span class="detail-value">${accountName}</span>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ 重要提醒：</strong>
            <p>請在轉帳時的備註欄填寫訂房編號 <strong>#${bookingId}</strong>，以便我們快速確認您的付款。</p>
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            我們將在收到您的轉帳後 24 小時內確認付款並發送確認郵件。如有任何問題，歡迎聯絡我們。
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 生成付款確認郵件（狀態：已付款）
export function generatePaymentConfirmedEmail(
  guestName: string,
  bookingId: number,
  totalPrice: string,
  checkInDate: Date
): string {
  const checkInFormatted = checkInDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-badge { display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .confirmation-box { background-color: #e8f5e9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ 付款已確認</h1>
          <p>您的付款已成功確認</p>
          <div class="success-badge">✓ 官方網站訂房</div>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>感謝您的付款！我們已成功收到您的轉帳，訂房已確認完成。</p>
          
          <div class="confirmation-box">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">已確認金額：</span>
              <span class="detail-value" style="color: #4CAF50; font-weight: bold;">NT$ ${totalPrice}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">入住日期：</span>
              <span class="detail-value">${checkInFormatted}</span>
            </div>
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            您的訂房已完全確認，我們期待您的到來！如有任何問題，歡迎隨時聯絡我們。
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 生成訂房完成郵件（狀態：已完成）
export function generateBookingCompletedEmail(
  guestName: string,
  bookingId: number,
  checkOutDate: Date
): string {
  const checkOutFormatted = checkOutDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .completion-badge { display: inline-block; background-color: #9C27B0; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .completion-box { background-color: #f3e5f5; padding: 20px; border-left: 4px solid #9C27B0; margin: 20px 0; border-radius: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 訂房已完成</h1>
          <p>感謝您的蒞臨</p>
          <div class="completion-badge">✓ 官方網站訂房</div>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>感謝您選擇歐堡商務汽車旅館！您的訂房已完成。</p>
          
          <div class="completion-box">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">退房日期：</span>
              <span class="detail-value">${checkOutFormatted}</span>
            </div>
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            如果您對我們的服務有任何建議或意見，歡迎隨時與我們聯絡。我們期待您的下次蒞臨！
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 生成訂房取消郵件
export function generateBookingCancelledEmail(
  guestName: string,
  bookingId: number,
  reason?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .cancel-badge { display: inline-block; background-color: #f44336; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .cancel-box { background-color: #ffebee; padding: 20px; border-left: 4px solid #f44336; margin: 20px 0; border-radius: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✕ 訂房已取消</h1>
          <p>您的訂房已被取消</p>
          <div class="cancel-badge">✓ 官方網站訂房</div>
        </div>
        
        <div class="content">
          <p>親愛的 ${guestName} 您好，</p>
          <p>您的訂房已被取消。以下是取消詳情：</p>
          
          <div class="cancel-box">
            <div class="detail-row">
              <span class="detail-label">訂房編號：</span>
              <span class="detail-value">#${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">狀態：</span>
              <span class="detail-value" style="color: #f44336; font-weight: bold;">已取消</span>
            </div>
            ${reason ? `
              <div class="detail-row">
                <span class="detail-label">取消原因：</span>
                <span class="detail-value">${reason}</span>
              </div>
            ` : ''}
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            如有任何問題或需要重新預訂，歡迎隨時聯絡我們。
          </p>
          
          <div class="footer">
            <p>© 2026 歐堡商務汽車旅館有限公司<br>此郵件由系統自動發送，請勿直接回覆。</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
