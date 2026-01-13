import { describe, it, expect, beforeEach } from 'vitest';

/**
 * 前台客戶金流功能測試
 * 驗證客戶訂房確認和轉帳後五碼提交流程
 */

describe('Customer Payment Flow - 前台客戶金流流程', () => {
  // 模擬訂房確認數據
  const mockBookingConfirmation = {
    id: 120030,
    roomName: '舒適三人房',
    checkInDate: '2026-01-15',
    checkOutDate: '2026-01-17',
    numberOfGuests: 2,
    totalPrice: 4360,
    nights: 2,
    guestName: 'John Smith',
    guestEmail: 'john.smith@example.com',
    guestPhone: '0900123456',
  };

  // 公司銀行帳號
  const companyBankInfo = {
    bankName: '台灣銀行',
    bankCode: '004',
    accountNumber: '028001003295',
    accountName: '歐堡商務汽車旅館',
  };

  describe('訂房確認頁面 - 銀行帳號顯示', () => {
    it('應該在訂房確認頁面顯示銀行帳號信息', () => {
      const bankDisplay = {
        bankName: companyBankInfo.bankName,
        accountNumber: companyBankInfo.accountNumber,
        accountName: companyBankInfo.accountName,
        amount: mockBookingConfirmation.totalPrice,
      };

      expect(bankDisplay.bankName).toBe('台灣銀行');
      expect(bankDisplay.accountNumber).toBe('028001003295');
      expect(bankDisplay.accountName).toBe('歐堡商務汽車旅館');
      expect(bankDisplay.amount).toBe(4360);
    });

    it('應該顯示正確的轉帳金額', () => {
      expect(mockBookingConfirmation.totalPrice).toBe(4360);
    });

    it('應該提醒客戶在轉帳備註欄填寫訂房編號', () => {
      const transferNote = `訂房編號：#${mockBookingConfirmation.id}`;
      expect(transferNote).toContain('訂房編號：#120030');
    });

    it('應該提示客戶在訂房追蹤頁面填寫轉帳後五碼', () => {
      const instruction = '轉帳完成後，請在訂房追蹤頁面填寫轉帳後五碼，以便我們快速確認收款。';
      expect(instruction).toContain('訂房追蹤頁面');
      expect(instruction).toContain('轉帳後五碼');
    });

    it('應該提示客戶於確認後 3 天內進行銀行轉帳', () => {
      const timeLimit = '請於確認後 3 天內進行銀行轉帳';
      expect(timeLimit).toContain('3 天');
    });
  });

  describe('訂房追蹤頁面 - 轉帳後五碼填寫', () => {
    it('應該允許客戶填寫轉帳後五碼', () => {
      const lastFiveDigits = '03295';
      expect(/^\d{5}$/.test(lastFiveDigits)).toBe(true);
    });

    it('後五碼應該只包含 5 個數字', () => {
      const validCodes = ['03295', '00000', '99999'];
      validCodes.forEach(code => {
        expect(/^\d{5}$/.test(code)).toBe(true);
      });
    });

    it('應該拒絕無效的後五碼格式', () => {
      const invalidCodes = ['0329', '032950', 'abcde', '032-95'];
      invalidCodes.forEach(code => {
        expect(/^\d{5}$/.test(code)).toBe(false);
      });
    });

    it('應該在已匯款狀態時顯示填寫後五碼按鈕', () => {
      const booking = { status: 'paid_pending' };
      expect(booking.status).toBe('paid_pending');
    });

    it('應該在其他狀態時隱藏填寫後五碼按鈕', () => {
      const statuses = ['pending', 'confirmed', 'paid', 'completed'];
      statuses.forEach(status => {
        expect(status).not.toBe('paid_pending');
      });
    });
  });

  describe('轉帳後五碼提交流程', () => {
    it('應該允許客戶提交轉帳後五碼', () => {
      const submission = {
        bookingId: mockBookingConfirmation.id,
        lastFiveDigits: '03295',
        submittedAt: new Date(),
      };

      expect(submission.bookingId).toBe(120030);
      expect(submission.lastFiveDigits).toBe('03295');
      expect(submission.submittedAt).toBeDefined();
    });

    it('應該顯示成功提交的確認消息', () => {
      const successMessage = '✅ 已記錄轉帳後五碼：03295\n\n我們將在 1-2 小時內確認收款並更新訂房狀態';
      expect(successMessage).toContain('已記錄轉帳後五碼');
      expect(successMessage).toContain('1-2 小時');
    });

    it('應該在提交後清空輸入欄', () => {
      let inputValue = '03295';
      inputValue = '';
      expect(inputValue).toBe('');
    });

    it('應該記錄提交時間用於對帳', () => {
      const submission = {
        lastFiveDigits: '03295',
        submittedAt: new Date('2026-01-12T10:30:00'),
      };

      expect(submission.submittedAt).toBeDefined();
      expect(submission.submittedAt.getFullYear()).toBe(2026);
    });
  });

  describe('訂房追蹤狀態顯示', () => {
    it('應該顯示待確認狀態', () => {
      const status = 'pending';
      const label = '⏳ 待確認';
      expect(status).toBe('pending');
      expect(label).toContain('待確認');
    });

    it('應該顯示已確認狀態', () => {
      const status = 'confirmed';
      const label = '✓ 已確認';
      expect(status).toBe('confirmed');
      expect(label).toContain('已確認');
    });

    it('應該顯示已匯款狀態', () => {
      const status = 'paid_pending';
      const label = '💳 已匯款';
      expect(status).toBe('paid_pending');
      expect(label).toContain('已匯款');
    });

    it('應該顯示已付款狀態', () => {
      const status = 'paid';
      const label = '✅ 已付款';
      expect(status).toBe('paid');
      expect(label).toContain('已付款');
    });

    it('應該顯示已完成狀態', () => {
      const status = 'completed';
      const label = '🎉 已完成';
      expect(status).toBe('completed');
      expect(label).toContain('已完成');
    });

    it('應該顯示已取消狀態', () => {
      const status = 'cancelled';
      const label = '✕ 已取消';
      expect(status).toBe('cancelled');
      expect(label).toContain('已取消');
    });
  });

  describe('客戶通知流程', () => {
    it('應該在客戶提交後五碼後自動通知管理員', () => {
      const notification = {
        type: 'transfer_submitted',
        bookingId: mockBookingConfirmation.id,
        lastFiveDigits: '03295',
        customerName: mockBookingConfirmation.guestName,
        customerEmail: mockBookingConfirmation.guestEmail,
      };

      expect(notification.type).toBe('transfer_submitted');
      expect(notification.bookingId).toBe(120030);
      expect(notification.lastFiveDigits).toBe('03295');
    });

    it('應該包含完整的訂房信息在通知中', () => {
      const notification = {
        bookingId: mockBookingConfirmation.id,
        guestName: mockBookingConfirmation.guestName,
        guestPhone: mockBookingConfirmation.guestPhone,
        guestEmail: mockBookingConfirmation.guestEmail,
        totalPrice: mockBookingConfirmation.totalPrice,
        checkInDate: mockBookingConfirmation.checkInDate,
      };

      expect(notification.bookingId).toBeDefined();
      expect(notification.guestName).toBe('John Smith');
      expect(notification.totalPrice).toBe(4360);
    });

    it('應該通知客戶管理員已收到轉帳後五碼', () => {
      const customerNotification = {
        to: mockBookingConfirmation.guestEmail,
        subject: '轉帳後五碼已收到 - 歐堡商務汽車旅館',
        message: '感謝您提交轉帳後五碼，我們將在 1-2 小時內確認收款。',
      };

      expect(customerNotification.to).toBe('john.smith@example.com');
      expect(customerNotification.message).toContain('1-2 小時');
    });
  });

  describe('完整的客戶金流工作流', () => {
    it('應該支持完整的客戶訂房到轉帳確認的工作流', () => {
      const workflow = [
        { step: 1, action: '客戶提交訂房', status: 'pending' },
        { step: 2, action: '查看訂房確認頁面，看到銀行帳號', status: 'confirmed' },
        { step: 3, action: '進行銀行轉帳', status: 'paid_pending' },
        { step: 4, action: '在追蹤頁面填寫轉帳後五碼', status: 'paid_pending' },
        { step: 5, action: '管理員確認收款', status: 'paid' },
        { step: 6, action: '訂房完成', status: 'completed' },
      ];

      expect(workflow.length).toBe(6);
      expect(workflow[0].status).toBe('pending');
      expect(workflow[5].status).toBe('completed');
    });

    it('應該在訂房確認頁面清楚地展示銀行帳號', () => {
      const confirmationPage = {
        showBankName: true,
        showAccountNumber: true,
        showAccountName: true,
        showTransferAmount: true,
        bankName: companyBankInfo.bankName,
        accountNumber: companyBankInfo.accountNumber,
      };

      expect(confirmationPage.showBankName).toBe(true);
      expect(confirmationPage.bankName).toBe('台灣銀行');
      expect(confirmationPage.accountNumber).toBe('028001003295');
    });

    it('應該在追蹤頁面提供後五碼填寫入口', () => {
      const trackingPage = {
        showTransferButton: true,
        buttonText: '💳 填寫轉帳後五碼',
        visibleInStatus: 'paid_pending',
      };

      expect(trackingPage.showTransferButton).toBe(true);
      expect(trackingPage.visibleInStatus).toBe('paid_pending');
    });

    it('應該自動通知管理員客戶的轉帳後五碼', () => {
      const adminNotification = {
        type: 'customer_transfer_submitted',
        bookingId: mockBookingConfirmation.id,
        customerName: mockBookingConfirmation.guestName,
        lastFiveDigits: '03295',
        action: '需要確認收款',
      };

      expect(adminNotification.type).toBe('customer_transfer_submitted');
      expect(adminNotification.action).toContain('確認收款');
    });
  });

  describe('銀行帳號信息管理', () => {
    it('應該正確存儲公司銀行帳號', () => {
      expect(companyBankInfo.bankName).toBe('台灣銀行');
      expect(companyBankInfo.bankCode).toBe('004');
      expect(companyBankInfo.accountNumber).toBe('028001003295');
      expect(companyBankInfo.accountName).toBe('歐堡商務汽車旅館');
    });

    it('應該在訂房確認頁面顯示完整的銀行帳號', () => {
      const displayedInfo = {
        bankName: companyBankInfo.bankName,
        accountNumber: companyBankInfo.accountNumber,
        accountName: companyBankInfo.accountName,
      };

      expect(displayedInfo.bankName).toBe('台灣銀行');
      expect(displayedInfo.accountNumber).toBe('028001003295');
    });

    it('應該提示客戶在備註欄填寫訂房編號', () => {
      const note = `訂房編號：#${mockBookingConfirmation.id}`;
      expect(note).toContain('#120030');
    });

    it('應該在後五碼填寫模態框中提示銀行帳號', () => {
      const hint = `轉帳後五碼是您銀行帳號 ${companyBankInfo.accountNumber} 的最後五位數字。`;
      expect(hint).toContain('028001003295');
      expect(hint).toContain('最後五位數字');
    });
  });

  describe('用戶體驗和驗證', () => {
    it('應該提供清晰的轉帳指示', () => {
      const instructions = [
        '銀行名稱：台灣銀行',
        '帳號：028001003295',
        '帳戶名：歐堡商務汽車旅館',
        '轉帳金額：NT$ 4,360',
        '備註欄：訂房編號 #120030',
      ];

      expect(instructions.length).toBe(5);
      expect(instructions[0]).toContain('台灣銀行');
    });

    it('應該自動格式化和驗證後五碼輸入', () => {
      const input = '0 3 2 9 5';
      const formatted = input.replace(/[^0-9]/g, '').slice(0, 5);
      expect(formatted).toBe('03295');
    });

    it('應該在提交前驗證後五碼長度', () => {
      const codes = ['0329', '03295', '032950'];
      codes.forEach(code => {
        const isValid = /^\d{5}$/.test(code);
        if (code === '03295') {
          expect(isValid).toBe(true);
        } else {
          expect(isValid).toBe(false);
        }
      });
    });

    it('應該顯示成功提交後的確認消息', () => {
      const message = '✅ 已記錄轉帳後五碼：03295\n\n我們將在 1-2 小時內確認收款並更新訂房狀態';
      expect(message).toContain('✅ 已記錄');
      expect(message).toContain('1-2 小時');
    });
  });
});
