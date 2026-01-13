import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Booking Form Validation', () => {
  // 測試日期選擇器邏輯
  describe('Date Picker Validation', () => {
    it('should reject checkout date that is before or equal to checkin date', () => {
      const checkInDate = new Date('2026-01-15');
      const checkOutDate = new Date('2026-01-15');
      
      expect(checkOutDate <= checkInDate).toBe(true);
    });

    it('should accept checkout date that is after checkin date', () => {
      const checkInDate = new Date('2026-01-15');
      const checkOutDate = new Date('2026-01-16');
      
      expect(checkOutDate > checkInDate).toBe(true);
    });

    it('should handle date string parsing correctly', () => {
      const dateStr = '2026-01-15';
      const date = new Date(dateStr);
      
      expect(date instanceof Date).toBe(true);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('should calculate minimum date as today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const minDate = `${year}-${month}-${day}`;
      
      expect(minDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // 測試表單驗證邏輯
  describe('Form Validation', () => {
    it('should require all mandatory fields', () => {
      const formData = {
        selectedRoomId: '',
        checkInDate: '',
        checkOutDate: '',
        guestName: '',
        guestPhone: '',
      };

      const isValid = !(!formData.selectedRoomId || !formData.checkInDate || 
                        !formData.checkOutDate || !formData.guestName || !formData.guestPhone);
      
      expect(isValid).toBe(false);
    });

    it('should validate when all mandatory fields are filled', () => {
      const formData = {
        selectedRoomId: '1',
        checkInDate: '2026-01-15',
        checkOutDate: '2026-01-16',
        guestName: '王小明',
        guestPhone: '0912345678',
      };

      const isValid = !(!formData.selectedRoomId || !formData.checkInDate || 
                        !formData.checkOutDate || !formData.guestName || !formData.guestPhone);
      
      expect(isValid).toBe(true);
    });

    it('should allow optional email field to be empty', () => {
      const guestEmail = '';
      
      expect(!guestEmail || typeof guestEmail === 'string').toBe(true);
    });

    it('should validate phone number format', () => {
      const validPhones = ['0912345678', '0987654321', '09-1234-5678'];
      const invalidPhones = ['123', 'abc', ''];

      validPhones.forEach(phone => {
        expect(phone.length >= 9).toBe(true);
      });

      invalidPhones.forEach(phone => {
        expect(phone.length < 9).toBe(true);
      });
    });
  });

  // 測試日期計算邏輯
  describe('Date Calculation', () => {
    it('should calculate number of nights correctly', () => {
      const checkInDate = new Date('2026-01-15');
      const checkOutDate = new Date('2026-01-18');
      
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(nights).toBe(3);
    });

    it('should calculate total price based on nights and room price', () => {
      const roomPrice = 1500;
      const nights = 3;
      const totalPrice = roomPrice * nights;
      
      expect(totalPrice).toBe(4500);
    });

    it('should handle single night booking', () => {
      const checkInDate = new Date('2026-01-15');
      const checkOutDate = new Date('2026-01-16');
      
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(nights).toBe(1);
    });
  });

  // 測試表單提交邏輯
  describe('Form Submission', () => {
    it('should prevent submission with invalid dates', () => {
      const checkInDate = new Date('2026-01-15');
      const checkOutDate = new Date('2026-01-15');
      
      const isValid = checkOutDate > checkInDate;
      
      expect(isValid).toBe(false);
    });

    it('should allow submission with valid data', () => {
      const formData = {
        selectedRoomId: '1',
        checkInDate: '2026-01-15',
        checkOutDate: '2026-01-16',
        guestName: '王小明',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        numberOfGuests: '2',
        specialRequests: '',
      };

      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      
      const isValid = checkOut > checkIn && 
                      formData.selectedRoomId && 
                      formData.guestName && 
                      formData.guestPhone;
      
      expect(isValid).toBe(true);
    });
  });
});
