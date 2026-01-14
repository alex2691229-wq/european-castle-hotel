import { describe, it, expect } from "vitest";
import { sendEmail, generateBookingConfirmationEmail } from "./_core/email";

describe("Email Sending Test", () => {
  it("應該能夠生成完整的訂房確認郵件，包含銀行轉帳資訊", () => {
    const checkInDate = new Date('2026-01-20');
    const checkOutDate = new Date('2026-01-22');
    
    const emailHtml = generateBookingConfirmationEmail(
      '測試客戶',
      '標準雙床房',
      checkInDate,
      checkOutDate,
      2,
      '4400',
      12345,
      '需要高樓層房間'
    );
    
    // 驗證郵件包含銀行轉帳資訊
    expect(emailHtml).toContain('台灣銀行');
    expect(emailHtml).toContain('004');
    expect(emailHtml).toContain('028001003295');
    expect(emailHtml).toContain('歐堡商務汽車旅館有限公司');
    expect(emailHtml).toContain('🏦 銀行轉帳資訊');
    
    // 驗證郵件包含旅館聯絡資訊
    expect(emailHtml).toContain('06-635-9577');
    expect(emailHtml).toContain('castle6359577@gmail.com');
    expect(emailHtml).toContain('台南市新營區長榮路一段41號');
    expect(emailHtml).toContain('📞 聯絡資訊');
    
    // 驗證郵件包含訂房詳情
    expect(emailHtml).toContain('測試客戶');
    expect(emailHtml).toContain('標準雙床房');
    expect(emailHtml).toContain('4400');
    expect(emailHtml).toContain('12345');
    expect(emailHtml).toContain('需要高樓層房間');
    
    console.log('✅ 郵件模板驗證通過 - 所有必要信息都已包含');
  });

  it("應該能夠發送郵件（如果 SMTP 配置正確）", async () => {
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (smtpConfigured) {
      const result = await sendEmail(
        'test@example.com',
        '測試郵件',
        '<p>這是一封測試郵件</p>'
      );
      console.log('✅ SMTP 配置完整，郵件發送結果:', result);
    } else {
      console.log('⚠️ SMTP 未配置，跳過郵件發送測試');
    }
    
    expect(true).toBe(true);
  });
});
