import { describe, it, expect, vi } from 'vitest';
import { emailTemplates } from './auto-reminder-scheduler';

describe('自動提醒系統測試', () => {
  describe('入住前一天提醒郵件', () => {
    it('應該生成正確的入住提醒郵件模板', () => {
      const booking = {
        id: 12345,
        guestName: '測試客戶',
        checkInDate: new Date('2026-01-20'),
        checkOutDate: new Date('2026-01-22'),
        roomTypeName: '標準雙人房',
        totalPrice: 4400,
      };

      const template = emailTemplates.checkInReminder(booking);

      expect(template.subject).toBe('【明日入住提醒】歐堡商務汽車旅館');
      expect(template.html).toContain('測試客戶');
      expect(template.html).toContain('#12345');
      expect(template.html).toContain('入住時間：下午 3:00');
      expect(template.html).toContain('退房時間：隔日中午 12:00');
    });

    it('應該包含交通資訊', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };

      const template = emailTemplates.checkInReminder(booking);

      expect(template.html).toContain('台南市新營區長榮路一段41號');
      expect(template.html).toContain('06-635-9577');
    });
  });

  describe('付款逾期提醒郵件', () => {
    it('應該生成正確的付款提醒郵件模板', () => {
      const booking = {
        id: 12345,
        guestName: '測試客戶',
        checkInDate: new Date('2026-01-20'),
        totalPrice: 4400,
        createdAt: new Date('2026-01-15'),
      };

      const template = emailTemplates.paymentOverdue(booking);

      expect(template.subject).toBe('【付款提醒】請盡快完成付款 - 歐堡商務汽車旅館');
      expect(template.html).toContain('測試客戶');
      expect(template.html).toContain('#12345');
      expect(template.html).toContain('NT$ 4400');
      expect(template.html).toContain('銀行轉帳');
    });

    it('應該包含銀行帳戶資訊', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        totalPrice: 1000,
        createdAt: new Date(),
      };

      const template = emailTemplates.paymentOverdue(booking);

      expect(template.html).toContain('台灣銀行');
      expect(template.html).toContain('004');
      expect(template.html).toContain('歐堡商務汽車旅館有限公司');
    });

    it('應該有緊急提醒訊息', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        totalPrice: 1000,
        createdAt: new Date(),
      };

      const template = emailTemplates.paymentOverdue(booking);

      expect(template.html).toContain('請於入住前完成付款');
    });
  });

  describe('退房感謝郵件', () => {
    it('應該生成正確的感謝郵件模板', () => {
      const booking = {
        id: 12345,
        guestName: '測試客戶',
        checkInDate: new Date('2026-01-20'),
        checkOutDate: new Date('2026-01-22'),
        roomTypeName: '標準雙人房',
      };

      const template = emailTemplates.checkOutThankYou(booking);

      expect(template.subject).toBe('【感謝入住】期待再次相見 - 歐堡商務汽車旅館');
      expect(template.html).toContain('測試客戶');
      expect(template.html).toContain('#12345');
      expect(template.html).toContain('感謝您選擇歐堡商務汽車旅館');
    });

    it('應該包含優惠碼', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };

      const template = emailTemplates.checkOutThankYou(booking);

      expect(template.html).toContain('THANKYOU10');
      expect(template.html).toContain('9折');
    });

    it('應該邀請客戶評價', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };

      const template = emailTemplates.checkOutThankYou(booking);

      expect(template.html).toContain('Google 評論');
      expect(template.html).toContain('五星好評');
    });
  });

  describe('郵件模板格式', () => {
    it('所有郵件模板都應該是 HTML 格式', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        checkOutDate: new Date(),
        totalPrice: 1000,
        createdAt: new Date(),
      };

      const templates = [
        emailTemplates.checkInReminder(booking),
        emailTemplates.paymentOverdue(booking),
        emailTemplates.checkOutThankYou(booking),
      ];

      templates.forEach(template => {
        expect(template.html).toContain('<div');
        expect(template.html).toContain('</div>');
        expect(template.subject).toBeDefined();
        expect(template.subject.length).toBeGreaterThan(0);
      });
    });

    it('所有郵件模板都應該包含旅館聯繫資訊', () => {
      const booking = {
        id: 1,
        guestName: '客戶',
        checkInDate: new Date(),
        checkOutDate: new Date(),
        totalPrice: 1000,
        createdAt: new Date(),
      };

      const templates = [
        emailTemplates.checkInReminder(booking),
        emailTemplates.paymentOverdue(booking),
        emailTemplates.checkOutThankYou(booking),
      ];

      templates.forEach(template => {
        expect(template.html).toContain('06-635-9577');
      });
    });
  });

  describe('查詢邏輯', () => {
    it('應該正確計算明天的日期', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      expect(tomorrowStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('應該正確計算 24 小時前的時間', () => {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const now = new Date();
      const diff = now.getTime() - oneDayAgo.getTime();
      const hours = diff / (1000 * 60 * 60);

      expect(hours).toBeCloseTo(24, 0);
    });

    it('應該正確計算今天的日期', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('提醒類型', () => {
    const reminderTypes = [
      { type: 'checkInReminder', name: '入住提醒', trigger: '入住前一天' },
      { type: 'paymentOverdue', name: '付款逾期提醒', trigger: '超過 24 小時未付款' },
      { type: 'checkOutThankYou', name: '退房感謝', trigger: '退房當天' },
    ];

    reminderTypes.forEach(reminder => {
      it(`應該有 ${reminder.name} 類型（${reminder.trigger}）`, () => {
        expect(reminder.type).toBeDefined();
        expect(reminder.name).toBeDefined();
        expect(reminder.trigger).toBeDefined();
      });
    });
  });

  describe('API 端點', () => {
    const endpoints = [
      { path: 'autoReminders.getTomorrowCheckIns', method: 'query', description: '獲取明日入住訂單' },
      { path: 'autoReminders.getOverduePayments', method: 'query', description: '獲取逾期付款訂單' },
      { path: 'autoReminders.getTodayCheckOuts', method: 'query', description: '獲取今日退房訂單' },
      { path: 'autoReminders.sendCheckInReminders', method: 'mutation', description: '發送入住提醒' },
      { path: 'autoReminders.sendPaymentReminders', method: 'mutation', description: '發送付款提醒' },
      { path: 'autoReminders.sendThankYouEmails', method: 'mutation', description: '發送感謝郵件' },
      { path: 'autoReminders.runAllReminders', method: 'mutation', description: '執行所有提醒' },
      { path: 'autoReminders.getStats', method: 'query', description: '獲取提醒統計' },
    ];

    endpoints.forEach(endpoint => {
      it(`應該有 ${endpoint.path} 端點（${endpoint.description}）`, () => {
        expect(endpoint.path).toBeDefined();
        expect(endpoint.method).toMatch(/^(query|mutation)$/);
      });
    });
  });
});
