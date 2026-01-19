// @ts-nocheck
import { router, protectedProcedure } from './_core/trpc.js';
// @ts-nocheck
import { TRPCError } from '@trpc/server';
import {
  scheduleConfirmationReminders,
  schedulePaymentReminders,
  scheduleCheckInReminders,
  initializeSchedulers,
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
 * 
 * 注意：以下路由暫時禁用，因為依賴的函數在 reminder-scheduler.ts 中不存在
 * 將在後續修復 reminder-scheduler.ts 後重新啟用
 */
export const autoRemindersRouter = router({
  // 暫時禁用所有自動提醒路由
  // getTomorrowCheckIns: adminProcedure.query(async () => { ... }),
  // getOverduePayments: adminProcedure.query(async () => { ... }),
  // getTodayCheckOuts: adminProcedure.query(async () => { ... }),
  // sendCheckInReminders: adminProcedure.mutation(async () => { ... }),
  // sendPaymentReminders: adminProcedure.mutation(async () => { ... }),
  // sendThankYouEmails: adminProcedure.mutation(async () => { ... }),
  // runAllReminders: adminProcedure.mutation(async () => { ... }),
  // getStats: adminProcedure.query(async () => { ... }),
  
  // 提供一個簡單的健康檢查端點
  health: adminProcedure.query(async () => {
    return {
      success: true,
      message: 'Auto reminders router is available (features temporarily disabled)',
    };
  }),
});
