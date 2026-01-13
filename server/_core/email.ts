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
          
          <p style="margin: 20px 0; color: #666;">
            我們將在 24 小時內確認您的訂房。如有任何問題，歡迎隨時聯絡我們。
          </p>
          
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
        </div>
        
        <div class="content">
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
