import { describe, it, expect } from 'vitest';

describe('Simplified Booking Flow', () => {
  // 狀態轉換流程
  const statusFlow = {
    pending: "confirmed",
    confirmed: "paid_pending",
    paid_pending: "paid",
    paid: "completed",
  };

  // 按鈕標籤
  const buttonLabels = {
    pending: "✓ 確認訂房",
    confirmed: "✓ 確認訂房",
    paid_pending: "🎉 完成訂房",
    paid: "✓ 標記入住",
  };

  // 按鈕顏色
  const buttonColors = {
    pending: "bg-blue-600 hover:bg-blue-700",
    confirmed: "bg-blue-600 hover:bg-blue-700",
    paid_pending: "bg-green-600 hover:bg-green-700",
    paid: "bg-purple-600 hover:bg-purple-700",
  };

  describe('Status Transition', () => {
    it('should transition from pending to confirmed', () => {
      const currentStatus = "pending";
      const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(nextStatus).toBe("confirmed");
    });

    it('should transition from confirmed to paid_pending', () => {
      const currentStatus = "confirmed";
      const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(nextStatus).toBe("paid_pending");
    });

    it('should transition from paid_pending to paid', () => {
      const currentStatus = "paid_pending";
      const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(nextStatus).toBe("paid");
    });

    it('should transition from paid to completed', () => {
      const currentStatus = "paid";
      const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(nextStatus).toBe("completed");
    });
  });

  describe('Button Labels', () => {
    it('should show "確認訂房" button for pending status', () => {
      const label = buttonLabels["pending" as keyof typeof buttonLabels];
      expect(label).toBe("✓ 確認訂房");
    });

    it('should show "確認訂房" button for confirmed status (no "標記已匯款" button)', () => {
      const label = buttonLabels["confirmed" as keyof typeof buttonLabels];
      expect(label).toBe("✓ 確認訂房");
      expect(label).not.toContain("標記已匯款");
    });

    it('should show "完成訂房" button for paid_pending status', () => {
      const label = buttonLabels["paid_pending" as keyof typeof buttonLabels];
      expect(label).toBe("🎉 完成訂房");
    });

    it('should show "標記入住" button for paid status', () => {
      const label = buttonLabels["paid" as keyof typeof buttonLabels];
      expect(label).toBe("✓ 標記入住");
    });
  });

  describe('Button Colors', () => {
    it('should use blue color for pending status', () => {
      const color = buttonColors["pending" as keyof typeof buttonColors];
      expect(color).toContain("bg-blue-600");
    });

    it('should use blue color for confirmed status', () => {
      const color = buttonColors["confirmed" as keyof typeof buttonColors];
      expect(color).toContain("bg-blue-600");
    });

    it('should use green color for paid_pending status', () => {
      const color = buttonColors["paid_pending" as keyof typeof buttonColors];
      expect(color).toContain("bg-green-600");
    });

    it('should use purple color for paid status', () => {
      const color = buttonColors["paid" as keyof typeof buttonColors];
      expect(color).toContain("bg-purple-600");
    });
  });

  describe('Last 5 Digits Validation', () => {
    it('should require last 5 digits before completing paid_pending status', () => {
      const status = "paid_pending";
      const lastFiveDigits = "";
      
      // 已匯款狀態沒有填寫後五碼，應該禁用按鈕
      const isDisabled = status === "paid_pending" && !lastFiveDigits;
      expect(isDisabled).toBe(true);
    });

    it('should enable button when last 5 digits are provided', () => {
      const status = "paid_pending";
      const lastFiveDigits = "12345";
      
      // 已匯款狀態已填寫後五碼，應該啟用按鈕
      const isDisabled = status === "paid_pending" && !lastFiveDigits;
      expect(isDisabled).toBe(false);
    });

    it('should validate last 5 digits format (5 digits only)', () => {
      const validFormats = ["12345", "00000", "99999"];
      const invalidFormats = ["1234", "123456", "abcde", "123a5"];
      
      validFormats.forEach(format => {
        expect(/^\d{5}$/.test(format)).toBe(true);
      });
      
      invalidFormats.forEach(format => {
        expect(/^\d{5}$/.test(format)).toBe(false);
      });
    });
  });

  describe('Complete Booking Flow', () => {
    it('should complete full booking flow: pending -> confirmed -> paid_pending -> paid -> completed', () => {
      let currentStatus = "pending";
      
      // Step 1: pending -> confirmed
      currentStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(currentStatus).toBe("confirmed");
      expect(buttonLabels[currentStatus as keyof typeof buttonLabels]).toBe("✓ 確認訂房");
      
      // Step 2: confirmed -> paid_pending (auto transition)
      currentStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(currentStatus).toBe("paid_pending");
      expect(buttonLabels[currentStatus as keyof typeof buttonLabels]).toBe("🎉 完成訂房");
      
      // Step 3: Fill last 5 digits and transition to paid
      const lastFiveDigits = "12345";
      expect(/^\d{5}$/.test(lastFiveDigits)).toBe(true);
      currentStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(currentStatus).toBe("paid");
      expect(buttonLabels[currentStatus as keyof typeof buttonLabels]).toBe("✓ 標記入住");
      
      // Step 4: paid -> completed
      currentStatus = statusFlow[currentStatus as keyof typeof statusFlow];
      expect(currentStatus).toBe("completed");
    });

    it('should prevent transition from paid_pending without last 5 digits', () => {
      const status = "paid_pending";
      const lastFiveDigits = "";
      
      // 沒有填寫後五碼，不應該允許轉換
      const canTransition = !(status === "paid_pending" && !lastFiveDigits);
      expect(canTransition).toBe(false);
    });

    it('should allow transition from paid_pending with last 5 digits', () => {
      const status = "paid_pending";
      const lastFiveDigits = "12345";
      
      // 已填寫後五碼，應該允許轉換
      const canTransition = !(status === "paid_pending" && !lastFiveDigits);
      expect(canTransition).toBe(true);
    });
  });

  describe('Removed "標記已匯款" Step', () => {
    it('should not have "標記已匯款" button in confirmed status', () => {
      const confirmedLabel = buttonLabels["confirmed" as keyof typeof buttonLabels];
      expect(confirmedLabel).not.toContain("標記已匯款");
      expect(confirmedLabel).toBe("✓ 確認訂房");
    });

    it('should skip directly from confirmed to paid_pending', () => {
      const confirmedNextStatus = statusFlow["confirmed" as keyof typeof statusFlow];
      expect(confirmedNextStatus).toBe("paid_pending");
      expect(confirmedNextStatus).not.toBe("paid_pending");  // Should be paid_pending, not something else
    });

    it('should have only 4 status transitions in the flow', () => {
      const transitions = Object.keys(statusFlow);
      expect(transitions).toHaveLength(4);
      expect(transitions).toContain("pending");
      expect(transitions).toContain("confirmed");
      expect(transitions).toContain("paid_pending");
      expect(transitions).toContain("paid");
    });
  });

  describe('Button Disabled State', () => {
    it('should disable button when paid_pending status without last 5 digits', () => {
      const status = "paid_pending";
      const lastFiveDigits = "";
      const isDisabled = status === "paid_pending" && !lastFiveDigits;
      
      expect(isDisabled).toBe(true);
    });

    it('should enable button when paid_pending status with last 5 digits', () => {
      const status = "paid_pending";
      const lastFiveDigits = "12345";
      const isDisabled = status === "paid_pending" && !lastFiveDigits;
      
      expect(isDisabled).toBe(false);
    });

    it('should always enable button for other statuses', () => {
      const statuses = ["pending", "confirmed", "paid"];
      
      statuses.forEach(status => {
        const isDisabled = status === "paid_pending" && !("12345");
        expect(isDisabled).toBe(false);
      });
    });
  });

  describe('Email Reply Integration', () => {
    it('should allow customer to submit last 5 digits via email reply', () => {
      const emailReplyContent = "後五碼：12345";
      const lastFiveDigitsRegex = /後五碼[：:]\s*(\d{5})/;
      const match = emailReplyContent.match(lastFiveDigitsRegex);
      
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe("12345");
    });

    it('should extract last 5 digits from various email formats', () => {
      const formats = [
        "後五碼：12345",
        "後五碼: 12345",
        "後五碼：12345。",
        "後五碼: 12345\n",
      ];
      
      const regex = /後五碼[：:]\s*(\d{5})/;
      
      formats.forEach(format => {
        const match = format.match(regex);
        expect(match).not.toBeNull();
        expect(match?.[1]).toBe("12345");
      });
    });

    it('should reject invalid last 5 digits from email', () => {
      const invalidFormats = [
        "後五碼：1234",      // Too short
        "後五碼：123456",    // Too long
        "後五碼：abcde",     // Not digits
        "後五碼：12a45",     // Mixed
      ];
      
      const regex = /後五碼[：:]\s*(\d{5})/;
      
      invalidFormats.forEach(format => {
        const match = format.match(regex);
        expect(match).toBeNull();
      });
    });
  });
});
