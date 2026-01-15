import { describe, it, expect } from 'vitest';

describe('儀表板統計功能測試', () => {
  describe('統計計算', () => {
    it('應該正確計算今日訂單數量', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const bookings = [
        { checkInDate: today, status: 'confirmed' },
        { checkInDate: today, status: 'pending' },
        { checkInDate: new Date('2026-01-20'), status: 'confirmed' },
      ];
      
      const todayBookings = bookings.filter((b) => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      }).length;
      
      expect(todayBookings).toBe(2);
    });

    it('應該正確計算待確認訂單數量', () => {
      const bookings = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'confirmed' },
        { status: 'paid' },
        { status: 'cancelled' },
      ];
      
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
      
      expect(pendingBookings).toBe(2);
    });

    it('應該正確計算已確認訂單數量', () => {
      const bookings = [
        { status: 'pending' },
        { status: 'confirmed' },
        { status: 'paid' },
        { status: 'cash_on_site' },
        { status: 'cancelled' },
      ];
      
      const confirmedBookings = bookings.filter((b) => 
        b.status === 'confirmed' || b.status === 'paid' || b.status === 'cash_on_site'
      ).length;
      
      expect(confirmedBookings).toBe(3);
    });

    it('應該正確計算本月營收', () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const bookings = [
        { createdAt: new Date(), status: 'paid', totalPrice: '4400' },
        { createdAt: new Date(), status: 'completed', totalPrice: '3500' },
        { createdAt: new Date(), status: 'pending', totalPrice: '2200' },
        { createdAt: new Date('2025-12-01'), status: 'paid', totalPrice: '5000' },
      ];
      
      const monthlyRevenue = bookings
        .filter((b) => {
          const createdAt = new Date(b.createdAt);
          return createdAt >= startOfMonth && (b.status === 'paid' || b.status === 'completed');
        })
        .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
      
      expect(monthlyRevenue).toBe(7900);
    });

    it('應該正確計算房間佔用率', () => {
      const today = new Date();
      
      const bookings = [
        { status: 'confirmed', checkOutDate: new Date('2026-02-01') },
        { status: 'paid', checkOutDate: new Date('2026-02-01') },
        { status: 'cancelled', checkOutDate: new Date('2026-02-01') },
        { status: 'confirmed', checkOutDate: new Date('2025-12-01') }, // 過期
      ];
      
      const roomTypes = [
        { maxSalesQuantity: 10 },
        { maxSalesQuantity: 5 },
      ];
      
      const activeBookings = bookings.filter((b) => 
        b.status !== 'cancelled' && new Date(b.checkOutDate) >= today
      ).length;
      
      const totalCapacity = roomTypes.reduce((sum, r) => sum + (r.maxSalesQuantity || 10), 0) * 30;
      const occupancyRate = totalCapacity > 0 ? Math.round((activeBookings / totalCapacity) * 100) : 0;
      
      expect(activeBookings).toBe(2);
      expect(totalCapacity).toBe(450);
      expect(occupancyRate).toBeLessThanOrEqual(100);
    });
  });

  describe('狀態分類', () => {
    it('應該正確識別有效訂單狀態', () => {
      const validStatuses = ['pending', 'confirmed', 'pending_payment', 'paid', 'cash_on_site', 'completed', 'cancelled'];
      
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('confirmed');
      expect(validStatuses).toContain('paid');
      expect(validStatuses).toContain('cash_on_site');
      expect(validStatuses).toContain('completed');
      expect(validStatuses).toContain('cancelled');
    });

    it('應該正確識別活躍訂單狀態', () => {
      const activeStatuses = ['confirmed', 'paid', 'cash_on_site'];
      
      expect(activeStatuses).not.toContain('pending');
      expect(activeStatuses).not.toContain('cancelled');
      expect(activeStatuses).toContain('confirmed');
      expect(activeStatuses).toContain('paid');
    });
  });

  describe('數據格式化', () => {
    it('應該正確格式化金額', () => {
      const amount = 44000;
      const formatted = `NT$ ${amount.toLocaleString()}`;
      
      expect(formatted).toBe('NT$ 44,000');
    });

    it('應該正確格式化百分比', () => {
      const rate = 75;
      const formatted = `${rate}%`;
      
      expect(formatted).toBe('75%');
    });

    it('應該限制佔用率最大值為 100%', () => {
      const calculateOccupancy = (active: number, capacity: number) => {
        const rate = capacity > 0 ? Math.round((active / capacity) * 100) : 0;
        return Math.min(rate, 100);
      };
      
      expect(calculateOccupancy(50, 100)).toBe(50);
      expect(calculateOccupancy(100, 100)).toBe(100);
      expect(calculateOccupancy(150, 100)).toBe(100); // 超過 100% 應該限制為 100%
    });
  });
});
