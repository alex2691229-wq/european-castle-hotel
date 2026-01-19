import { describe, it, expect, vi, beforeEach } from 'vitest.js';
import * as db from './db.js';
import { sendEmail } from './_core/email.js';
import { bookingRemindersRouter } from './routers.booking-reminders.js';

// Mock dependencies
vi.mock('./db');
vi.mock('./_core/email');

describe('Booking Reminders Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingBookings', () => {
    it('should return pending bookings', async () => {
      const mockBookings = [
        {
          id: 1,
          status: 'pending',
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          checkInDate: new Date('2026-01-20'),
          checkOutDate: new Date('2026-01-22'),
          totalPrice: '4400.00',
          createdAt: new Date(),
          updatedAt: new Date(),
          roomTypeId: 1,
          guestPhone: '0912345678',
          numberOfGuests: 2,
          specialRequests: null,
        },
      ];

      vi.mocked(db.getAllBookings).mockResolvedValue(mockBookings);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).getPendingBookings();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('should return empty array when no pending bookings', async () => {
      vi.mocked(db.getAllBookings).mockResolvedValue([]);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).getPendingBookings();

      expect(result).toHaveLength(0);
    });
  });

  describe('getOverduePaymentBookings', () => {
    it('should return overdue payment bookings', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const mockBookings = [
        {
          id: 2,
          status: 'pending_payment',
          guestName: 'Jane Smith',
          guestEmail: 'jane@example.com',
          checkInDate: new Date('2026-01-25'),
          checkOutDate: new Date('2026-01-27'),
          totalPrice: '5500.00',
          createdAt: fourDaysAgo,
          updatedAt: new Date(),
          roomTypeId: 2,
          guestPhone: '0987654321',
          numberOfGuests: 2,
          specialRequests: null,
        },
      ];

      vi.mocked(db.getAllBookings).mockResolvedValue(mockBookings);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).getOverduePaymentBookings();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending_payment');
    });
  });

  describe('batchConfirmBookings', () => {
    it('should confirm multiple bookings', async () => {
      const mockBooking = {
        id: 1,
        status: 'pending',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        checkInDate: new Date('2026-01-20'),
        checkOutDate: new Date('2026-01-22'),
        totalPrice: '4400.00',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeId: 1,
        guestPhone: '0912345678',
        numberOfGuests: 2,
        specialRequests: null,
      };

      vi.mocked(db.getBookingById).mockResolvedValue(mockBooking);
      vi.mocked(db.updateBookingStatus).mockResolvedValue(undefined);
      vi.mocked(sendEmail).mockResolvedValue(true);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).batchConfirmBookings({ bookingIds: [1] });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(db.updateBookingStatus).toHaveBeenCalledWith(1, 'confirmed');
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should handle non-existent bookings', async () => {
      vi.mocked(db.getBookingById).mockResolvedValue(undefined);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).batchConfirmBookings({ bookingIds: [999] });

      expect(result.success).toBe(true);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('訂單不存在');
    });
  });

  describe('batchSendEmail', () => {
    it('should send emails to multiple bookings', async () => {
      const mockBooking = {
        id: 1,
        status: 'confirmed',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        checkInDate: new Date('2026-01-20'),
        checkOutDate: new Date('2026-01-22'),
        totalPrice: '4400.00',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeId: 1,
        guestPhone: '0912345678',
        numberOfGuests: 2,
        specialRequests: null,
      };

      vi.mocked(db.getBookingById).mockResolvedValue(mockBooking);
      vi.mocked(sendEmail).mockResolvedValue(true);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).batchSendEmail({
        bookingIds: [1],
        subject: 'Test Subject',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        'Test Subject',
        expect.stringContaining('Test message')
      );
    });
  });

  describe('batchCancelBookings', () => {
    it('should cancel multiple bookings', async () => {
      const mockBooking = {
        id: 1,
        status: 'confirmed',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        checkInDate: new Date('2026-01-20'),
        checkOutDate: new Date('2026-01-22'),
        totalPrice: '4400.00',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeId: 1,
        guestPhone: '0912345678',
        numberOfGuests: 2,
        specialRequests: null,
      };

      vi.mocked(db.getBookingById).mockResolvedValue(mockBooking);
      vi.mocked(db.updateBookingStatus).mockResolvedValue(undefined);
      vi.mocked(sendEmail).mockResolvedValue(true);

      const result = await bookingRemindersRouter.createCaller({
        user: { role: 'admin', id: 1 },
      }).batchCancelBookings({
        bookingIds: [1],
        reason: 'Customer request',
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(db.updateBookingStatus).toHaveBeenCalledWith(1, 'cancelled');
    });
  });
});
