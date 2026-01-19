import { router, protectedProcedure } from './_core/trpc.js';
import { TRPCError } from '@trpc/server';
import {
  getTomorrowCheckInBookings,
  getOverdue24HoursPaymentBookings,
  getTodayCheckOutBookings,
  sendCheckInReminders,
  sendPaymentOverdueReminders,
  sendCheckOutThankYouEmails,
  runAllAutoReminders,
} from './schedulers/reminder-scheduler.js';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

/**
 * 自動提醒路由
 * 提供手動觸發和查看自動提醒狀態的功能
 */
export const autoRemindersRouter = router({
  /**
   * 獲取明天入住的訂單列表
   */
  getTomorrowCheckIns: adminProcedure.query(async () => {
    try {
      const bookings = await getTomorrowCheckInBookings();
      return {
        success: true,
        count: bookings.length,
        bookings: bookings.map(b => ({
          id: b.id,
          guestName: b.guestName,
          guestEmail: b.guestEmail,
          guestPhone: b.guestPhone,
          checkInDate: b.checkInDate,
          status: b.status,
        })),
      };
    } catch (error) {
      console.error('Error getting tomorrow check-ins:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '無法獲取明日入住訂單',
      });
    }
  }),

  /**
   * 獲取超過 24 小時未付款的訂單列表
   */
  getOverduePayments: adminProcedure.query(async () => {
    try {
      const bookings = await getOverdue24HoursPaymentBookings();
      return {
        success: true,
        count: bookings.length,
        bookings: bookings.map(b => ({
          id: b.id,
          guestName: b.guestName,
          guestEmail: b.guestEmail,
          guestPhone: b.guestPhone,
          checkInDate: b.checkInDate,
          totalPrice: b.totalPrice,
          createdAt: b.createdAt,
          status: b.status,
        })),
      };
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '無法獲取逾期付款訂單',
      });
    }
  }),

  /**
   * 獲取今天退房的訂單列表
   */
  getTodayCheckOuts: adminProcedure.query(async () => {
    try {
      const bookings = await getTodayCheckOutBookings();
      return {
        success: true,
        count: bookings.length,
        bookings: bookings.map(b => ({
          id: b.id,
          guestName: b.guestName,
          guestEmail: b.guestEmail,
          checkOutDate: b.checkOutDate,
          status: b.status,
        })),
      };
    } catch (error) {
      console.error('Error getting today check-outs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '無法獲取今日退房訂單',
      });
    }
  }),

  /**
   * 手動發送入住提醒郵件
   */
  sendCheckInReminders: adminProcedure.mutation(async () => {
    try {
      const result = await sendCheckInReminders();
      return {
        success: true,
        message: `已發送 ${result.results.filter(r => r.success).length}/${result.total} 封入住提醒郵件`,
        details: result,
      };
    } catch (error) {
      console.error('Error sending check-in reminders:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '發送入住提醒失敗',
      });
    }
  }),

  /**
   * 手動發送付款逾期提醒郵件
   */
  sendPaymentReminders: adminProcedure.mutation(async () => {
    try {
      const result = await sendPaymentOverdueReminders();
      return {
        success: true,
        message: `已發送 ${result.results.filter(r => r.success).length}/${result.total} 封付款提醒郵件`,
        details: result,
      };
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '發送付款提醒失敗',
      });
    }
  }),

  /**
   * 手動發送退房感謝郵件
   */
  sendThankYouEmails: adminProcedure.mutation(async () => {
    try {
      const result = await sendCheckOutThankYouEmails();
      return {
        success: true,
        message: `已發送 ${result.results.filter(r => r.success).length}/${result.total} 封感謝郵件`,
        details: result,
      };
    } catch (error) {
      console.error('Error sending thank you emails:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '發送感謝郵件失敗',
      });
    }
  }),

  /**
   * 執行所有自動提醒任務
   */
  runAllReminders: adminProcedure.mutation(async () => {
    try {
      const result = await runAllAutoReminders();
      return {
        success: true,
        message: '所有自動提醒任務已執行完成',
        details: result,
      };
    } catch (error) {
      console.error('Error running all reminders:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '執行自動提醒任務失敗',
      });
    }
  }),

  /**
   * 獲取自動提醒統計
   */
  getStats: adminProcedure.query(async () => {
    try {
      const [tomorrowCheckIns, overduePayments, todayCheckOuts] = await Promise.all([
        getTomorrowCheckInBookings(),
        getOverdue24HoursPaymentBookings(),
        getTodayCheckOutBookings(),
      ]);

      return {
        success: true,
        stats: {
          tomorrowCheckIns: tomorrowCheckIns.length,
          overduePayments: overduePayments.length,
          todayCheckOuts: todayCheckOuts.length,
        },
      };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '無法獲取提醒統計',
      });
    }
  }),
});
