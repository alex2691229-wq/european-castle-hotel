import { router, adminProcedure } from './_core/trpc.js';
import { z } from 'zod';
import * as db from './db.js';
import { sendEmail } from './_core/email.js';
import { TRPCError } from '@trpc/server';
/**
 * 訂單提醒和批量操作路由
 * 提供自動提醒和批量操作功能
 */
export const bookingRemindersRouter = router({
  /**
   * 獲取待確認訂單列表
   * 用於自動提醒系統
   */
  getPendingBookings: adminProcedure.query(async () => {
    try {
      const allBookings = await db.getAllBookings();
      const pendingBookings = allBookings.filter(b => b.status === 'pending');
      return pendingBookings;
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: '無法獲取待確認訂單' 
      });
    }
  }),

  /**
   * 獲取待付款訂單列表（超過 3 天）
   * 用於自動提醒系統
   */
  getOverduePaymentBookings: adminProcedure.query(async () => {
    try {
      const allBookings = await db.getAllBookings();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const overdueBookings = allBookings.filter(b => 
        b.status === 'pending_payment' && 
        new Date(b.createdAt) < threeDaysAgo
      );
      return overdueBookings;
    } catch (error) {
      console.error('Error fetching overdue payment bookings:', error);
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: '無法獲取待付款訂單' 
      });
    }
  }),

  /**
   * 獲取明日入住的訂單列表
   * 用於自動提醒系統
   */
  getTomorrowCheckInBookings: adminProcedure.query(async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const allBookings = await db.getAllBookings();
      const tomorrowBookings = allBookings.filter(b => {
        const checkInDate = new Date(b.checkInDate).toISOString().split('T')[0];
        return checkInDate === tomorrowStr && 
               (b.status === 'paid' || b.status === 'cash_on_site');
      });
      return tomorrowBookings;
    } catch (error) {
      console.error('Error fetching tomorrow check-in bookings:', error);
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: '無法獲取明日入住訂單' 
      });
    }
  }),

  /**
   * 發送提醒郵件給客戶
   */
  sendReminderEmail: adminProcedure
    .input(z.object({
      bookingId: z.number(),
      reminderType: z.enum(['pending', 'payment', 'checkin']),
    }))
    .mutation(async ({ input }) => {
      try {
        const booking = await db.getBookingById(input.bookingId);

        if (!booking) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: '訂單不存在' 
          });
        }

        let subject = '';
        let emailContent = '';

        switch (input.reminderType) {
          case 'pending':
            subject = '訂房確認提醒 - 歐堡商務汽車旅館';
            emailContent = `
              <p>親愛的 ${booking.guestName}，</p>
              <p>感謝您的訂房！我們已收到您的訂房申請，正在進行審核。</p>
              <p><strong>訂單編號：</strong> ${booking.id}</p>
              <p><strong>入住日期：</strong> ${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</p>
              <p><strong>退房日期：</strong> ${new Date(booking.checkOutDate).toLocaleDateString('zh-TW')}</p>
              <p>我們將在 24 小時內確認您的訂房。如有任何問題，請聯繫我們。</p>
              <p>聯繫電話：06-635-9577</p>
              <p>謝謝！</p>
            `;
            break;

          case 'payment':
            subject = '待付款提醒 - 歐堡商務汽車旅館';
            emailContent = `
              <p>親愛的 ${booking.guestName}，</p>
              <p>您的訂房已確認，請盡快完成支付。</p>
              <p><strong>訂單編號：</strong> ${booking.id}</p>
              <p><strong>應付金額：</strong> NT$ ${booking.totalPrice}</p>
              <p><strong>支付方式：</strong> 銀行轉帳</p>
              <p>銀行帳戶資訊已發送至您的郵箱，請查收。</p>
              <p>如有任何問題，請聯繫我們。</p>
              <p>聯繫電話：06-635-9577</p>
              <p>謝謝！</p>
            `;
            break;

          case 'checkin':
            subject = '入住提醒 - 歐堡商務汽車旅館';
            emailContent = `
              <p>親愛的 ${booking.guestName}，</p>
              <p>您即將入住我們的旅館！</p>
              <p><strong>訂單編號：</strong> ${booking.id}</p>
              <p><strong>入住日期：</strong> ${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</p>
              <p>我們已為您準備好房間，期待您的到來！</p>
              <p>入住時間：下午 3:00 起</p>
              <p>如需提前入住，請提前聯繫我們。</p>
              <p>聯繫電話：06-635-9577</p>
              <p>謝謝！</p>
            `;
            break;
        }

        if (booking.guestEmail) {
          await sendEmail(
            booking.guestEmail,
            subject,
            emailContent
          );
        }

        return { success: true, message: '提醒郵件已發送' };
      } catch (error) {
        console.error('Error sending reminder email:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: '無法發送提醒郵件' 
        });
      }
    }),

  /**
   * 批量確認訂單
   */
  batchConfirmBookings: adminProcedure
    .input(z.object({
      bookingIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      try {
        const results = [];

        for (const bookingId of input.bookingIds) {
          const booking = await db.getBookingById(bookingId);

          if (!booking) {
            results.push({ bookingId, success: false, error: '訂單不存在' });
            continue;
          }

          // 更新訂單狀態為已確認
          await db.updateBookingStatus(bookingId, 'confirmed');

          // 發送確認郵件
          try {
            if (booking.guestEmail) {
              await sendEmail(
                booking.guestEmail,
                '訂房已確認 - 歐堡商務汽車旅館',
                `
                  <p>親愛的 ${booking.guestName}，</p>
                  <p>您的訂房已確認！</p>
                  <p><strong>訂單編號：</strong> ${booking.id}</p>
                  <p><strong>入住日期：</strong> ${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}</p>
                  <p><strong>退房日期：</strong> ${new Date(booking.checkOutDate).toLocaleDateString('zh-TW')}</p>
                  <p><strong>應付金額：</strong> NT$ ${booking.totalPrice}</p>
                  <p>請選擇支付方式並完成支付。謝謝！</p>
                `
              );
            }
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }

          results.push({ bookingId, success: true });
        }

        return { success: true, results };
      } catch (error) {
        console.error('Error batch confirming bookings:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: '無法批量確認訂單' 
        });
      }
    }),

  /**
   * 批量發送郵件
   */
  batchSendEmail: adminProcedure
    .input(z.object({
      bookingIds: z.array(z.number()),
      subject: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const results = [];

        for (const bookingId of input.bookingIds) {
          const booking = await db.getBookingById(bookingId);

          if (!booking) {
            results.push({ bookingId, success: false, error: '訂單不存在' });
            continue;
          }

          try {
            if (booking.guestEmail) {
              await sendEmail(
                booking.guestEmail,
                input.subject,
                `
                  <p>親愛的 ${booking.guestName}，</p>
                  <p>${input.message}</p>
                  <p><strong>訂單編號：</strong> ${booking.id}</p>
                  <p>謝謝！</p>
                `
              );
            }
            results.push({ bookingId, success: true });
          } catch (emailError) {
            console.error('Error sending email:', emailError);
            results.push({ bookingId, success: false, error: '郵件發送失敗' });
          }
        }

        return { success: true, results };
      } catch (error) {
        console.error('Error batch sending emails:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: '無法批量發送郵件' 
        });
      }
    }),

  /**
   * 批量取消訂單
   */
  batchCancelBookings: adminProcedure
    .input(z.object({
      bookingIds: z.array(z.number()),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const results = [];

        for (const bookingId of input.bookingIds) {
          const booking = await db.getBookingById(bookingId);

          if (!booking) {
            results.push({ bookingId, success: false, error: '訂單不存在' });
            continue;
          }

          // 更新訂單狀態為已取消
          await db.updateBookingStatus(bookingId, 'cancelled');

          // 發送取消確認郵件
          try {
            if (booking.guestEmail) {
              await sendEmail(
                booking.guestEmail,
                '訂房已取消 - 歐堡商務汽車旅館',
                `
                  <p>親愛的 ${booking.guestName}，</p>
                  <p>您的訂房已取消。</p>
                  <p><strong>訂單編號：</strong> ${booking.id}</p>
                  <p><strong>取消原因：</strong> ${input.reason || '客戶申請'}</p>
                  <p>如有任何問題，請聯繫我們。</p>
                  <p>聯繫電話：06-635-9577</p>
                `
              );
            }
          } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
          }

          results.push({ bookingId, success: true });
        }

        return { success: true, results };
      } catch (error) {
        console.error('Error batch cancelling bookings:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: '無法批量取消訂單' 
        });
      }
    }),
});
