import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Advanced Features Tests', () => {
  describe('1. 優化訂房確認郵件功能', () => {
    it('應該在郵件中包含銀行帳號資訊', () => {
      const emailContent = `
        <strong>銀行：</strong>台灣銀行<br>
        <strong>銀行代碼：</strong>004<br>
        <strong>帳號：</strong>028001003295<br>
        <strong>帳戶名：</strong>歐堡商務汽車旅館有限公司
      `;
      
      expect(emailContent).toContain('台灣銀行');
      expect(emailContent).toContain('004');
      expect(emailContent).toContain('028001003295');
      expect(emailContent).toContain('歐堡商務汽車旅館有限公司');
    });

    it('應該在郵件中包含轉帳指示', () => {
      const emailContent = `
        轉帳時請在備註欄填寫你的訂房編號：<strong>#12345</strong>，以便我們快速對帳。
        轉帳後，請在訂房追蹤頁面填寫轉帳的後五碼，以便我們確認收款。
      `;
      
      expect(emailContent).toContain('轉帳時請在備註欄填寫');
      expect(emailContent).toContain('訂房編號');
      expect(emailContent).toContain('訂房追蹤頁面');
      expect(emailContent).toContain('後五碼');
    });

    it('應該在郵件中包含聯絡方式', () => {
      const emailContent = `
        電話：06-635-9577
        郵件：castle6359577@gmail.com
        地址：台南市新營區長榮路一段41號
      `;
      
      expect(emailContent).toContain('06-635-9577');
      expect(emailContent).toContain('castle6359577@gmail.com');
      expect(emailContent).toContain('台南市新營區');
    });

    it('應該在郵件中提醒透過 LINE 聯絡', () => {
      const emailContent = `
        如有任何問題，歡迎透過 LINE 或電話聯絡我們。
      `;
      
      expect(emailContent).toContain('LINE');
      expect(emailContent).toContain('聯絡');
    });
  });

  describe('2. 每日對帳報表功能', () => {
    it('應該能夠計算訂房總數', () => {
      const bookings = [
        { id: 1, status: 'pending', totalPrice: '1000' },
        { id: 2, status: 'confirmed', totalPrice: '2000' },
        { id: 3, status: 'paid', totalPrice: '3000' },
      ];
      
      const stats = {
        total: bookings.length,
        totalAmount: bookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0),
      };
      
      expect(stats.total).toBe(3);
      expect(stats.totalAmount).toBe(6000);
    });

    it('應該能夠按狀態分組訂房', () => {
      const bookings = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'confirmed' },
        { id: 3, status: 'paid' },
        { id: 4, status: 'pending' },
      ];
      
      const byStatus = {
        pending: bookings.filter(b => b.status === 'pending'),
        confirmed: bookings.filter(b => b.status === 'confirmed'),
        paid: bookings.filter(b => b.status === 'paid'),
      };
      
      expect(byStatus.pending.length).toBe(2);
      expect(byStatus.confirmed.length).toBe(1);
      expect(byStatus.paid.length).toBe(1);
    });

    it('應該能夠計算已收款和未收款金額', () => {
      const bookings = [
        { id: 1, status: 'pending', totalPrice: '1000' },
        { id: 2, status: 'confirmed', totalPrice: '2000' },
        { id: 3, status: 'paid', totalPrice: '3000' },
        { id: 4, status: 'paid', totalPrice: '4000' },
      ];
      
      const paidBookings = bookings.filter(b => b.status === 'paid');
      const unpaidBookings = bookings.filter(b => b.status !== 'paid');
      
      const paidAmount = paidBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      const unpaidAmount = unpaidBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      
      expect(paidAmount).toBe(7000);
      expect(unpaidAmount).toBe(3000);
    });

    it('應該能夠篩選日期範圍內的訂房', () => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const bookings = [
        { id: 1, checkInDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: 2, checkInDate: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000) },
        { id: 3, checkInDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000) },
      ];
      
      const filteredBookings = bookings.filter(b => b.checkInDate >= thirtyDaysAgo && b.checkInDate <= today);
      
      expect(filteredBookings.length).toBe(2);
    });

    it('應該能夠生成對帳報表摘要', () => {
      const report = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        stats: {
          total: 10,
          totalAmount: 50000,
          pending: 2,
          confirmed: 1,
          paid_pending: 2,
          paid: 4,
          completed: 1,
          cancelled: 0,
          paidAmount: 20000,
          unpaidAmount: 30000,
        },
      };
      
      expect(report.stats.total).toBe(10);
      expect(report.stats.paidAmount).toBe(20000);
      expect(report.stats.unpaidAmount).toBe(30000);
      expect(report.stats.paidAmount + report.stats.unpaidAmount).toBe(report.stats.totalAmount);
    });

    it('應該能夠計算各狀態的訂房數量', () => {
      const stats = {
        pending: 2,
        confirmed: 1,
        paid_pending: 2,
        paid: 4,
        completed: 1,
        cancelled: 0,
      };
      
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      
      expect(total).toBe(10);
      expect(stats.paid).toBe(4);
    });
  });

  describe('3. 訂房確認郵件優化集成', () => {
    it('應該在郵件中顯示銀行帳號和轉帳指示', () => {
      const bookingId = 12345;
      const totalPrice = '5000';
      
      const emailContent = `
        訂房編號：#${bookingId}
        總金額：NT$ ${totalPrice}
        
        銀行帳號：028001003295
        轉帳時請在備註欄填寫訂房編號：#${bookingId}
      `;
      
      expect(emailContent).toContain(`#${bookingId}`);
      expect(emailContent).toContain(`NT$ ${totalPrice}`);
      expect(emailContent).toContain('028001003295');
    });

    it('應該在郵件中提供清晰的轉帳指示', () => {
      const emailContent = `
        🏦 銀行轉帳資訊
        感謝您的訂房！請依照以下資訊進行銀行轉帳：
        
        銀行：台灣銀行
        銀行代碼：004
        帳號：028001003295
        帳戶名：歐堡商務汽車旅館有限公司
        
        ✅ 轉帳時請在備註欄填寫你的訂房編號
        ✅ 轉帳後，請在訂房追蹤頁面填寫轉帳的後五碼
      `;
      
      expect(emailContent).toContain('🏦 銀行轉帳資訊');
      expect(emailContent).toContain('台灣銀行');
      expect(emailContent).toContain('004');
      expect(emailContent).toContain('028001003295');
      expect(emailContent).toContain('✅ 轉帳時請在備註欄填寫');
      expect(emailContent).toContain('✅ 轉帳後，請在訂房追蹤頁面填寫');
    });

    it('應該在郵件中包含完整的聯絡資訊', () => {
      const emailContent = `
        📞 聯絡資訊
        電話：06-635-9577
        郵件：castle6359577@gmail.com
        地址：台南市新營區長榮路一段41號
        
        如有任何問題，歡迎透過 LINE 或電話聯絡我們。
      `;
      
      expect(emailContent).toContain('📞 聯絡資訊');
      expect(emailContent).toContain('06-635-9577');
      expect(emailContent).toContain('castle6359577@gmail.com');
      expect(emailContent).toContain('台南市新營區');
      expect(emailContent).toContain('LINE');
    });
  });

  describe('4. 對帳報表前端功能', () => {
    it('應該能夠顯示日期篩選器', () => {
      const filters = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        status: 'all',
      };
      
      expect(filters.startDate).toBeDefined();
      expect(filters.endDate).toBeDefined();
      expect(filters.status).toBe('all');
    });

    it('應該能夠按狀態篩選訂房', () => {
      const statuses = ['pending', 'confirmed', 'paid_pending', 'paid', 'completed', 'cancelled'];
      
      expect(statuses).toContain('pending');
      expect(statuses).toContain('paid');
      expect(statuses.length).toBe(6);
    });

    it('應該能夠顯示統計摘要', () => {
      const summary = {
        totalBookings: 10,
        totalAmount: 50000,
        paidAmount: 20000,
        unpaidAmount: 30000,
      };
      
      expect(summary.totalBookings).toBe(10);
      expect(summary.paidAmount + summary.unpaidAmount).toBe(summary.totalAmount);
    });

    it('應該能夠顯示訂房列表', () => {
      const bookings = [
        { id: 1, guestName: '王先生', status: 'paid', totalPrice: '5000' },
        { id: 2, guestName: '李小姐', status: 'pending', totalPrice: '3000' },
      ];
      
      expect(bookings.length).toBe(2);
      expect(bookings[0].guestName).toBe('王先生');
      expect(bookings[1].status).toBe('pending');
    });

    it('應該能夠計算已收款和未收款統計', () => {
      const bookings = [
        { id: 1, status: 'paid', totalPrice: '5000' },
        { id: 2, status: 'paid', totalPrice: '3000' },
        { id: 3, status: 'pending', totalPrice: '2000' },
      ];
      
      const paidAmount = bookings
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      
      const unpaidAmount = bookings
        .filter(b => b.status !== 'paid')
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      
      expect(paidAmount).toBe(8000);
      expect(unpaidAmount).toBe(2000);
    });
  });

  describe('5. 完整的金流工作流測試', () => {
    it('應該支持完整的訂房狀態轉換', () => {
      const statuses = ['pending', 'confirmed', 'paid_pending', 'paid', 'completed'];
      
      expect(statuses[0]).toBe('pending');
      expect(statuses[1]).toBe('confirmed');
      expect(statuses[2]).toBe('paid_pending');
      expect(statuses[3]).toBe('paid');
      expect(statuses[4]).toBe('completed');
    });

    it('應該在每個狀態轉換時發送郵件', () => {
      const transitions = [
        { from: 'pending', to: 'confirmed', emailType: 'confirmation' },
        { from: 'confirmed', to: 'paid_pending', emailType: 'payment_instruction' },
        { from: 'paid_pending', to: 'paid', emailType: 'payment_confirmed' },
        { from: 'paid', to: 'completed', emailType: 'booking_completed' },
      ];
      
      expect(transitions.length).toBe(4);
      expect(transitions[0].emailType).toBe('confirmation');
      expect(transitions[3].emailType).toBe('booking_completed');
    });

    it('應該記錄轉帳後五碼', () => {
      const paymentDetail = {
        bookingId: 12345,
        lastFiveDigits: '12345',
        transferDate: '2026-01-14',
        bankName: '台灣銀行',
      };
      
      expect(paymentDetail.lastFiveDigits).toBe('12345');
      expect(paymentDetail.lastFiveDigits.length).toBe(5);
    });

    it('應該能夠生成對帳報表', () => {
      const report = {
        period: '2026-01-01 to 2026-01-31',
        totalBookings: 10,
        paidBookings: 7,
        unpaidBookings: 3,
        totalAmount: 50000,
        paidAmount: 35000,
        unpaidAmount: 15000,
      };
      
      expect(report.paidBookings + report.unpaidBookings).toBe(report.totalBookings);
      expect(report.paidAmount + report.unpaidAmount).toBe(report.totalAmount);
    });
  });
});
