import { getSessionCookieOptions } from './_core/cookies.js';
import { COOKIE_NAME } from '@shared/const.js';
import { systemRouter } from './_core/systemRouter.js';
import { publicProcedure, router, protectedProcedure } from './_core/trpc.js';
import { z } from 'zod';
import * as db from './db.js';
import { TRPCError } from '@trpc/server';
import { notifyOwner } from './_core/notification.js';
import { sendEmail, generateBookingConfirmationEmail, generateAdminNotificationEmail, generateBookingConfirmedEmail, generatePaymentInstructionEmail, generatePaymentConfirmedEmail, generateBookingCompletedEmail, generateBookingCancelledEmail } from './_core/email.js';
import { storagePut } from './storage.js';
import { invokeLLM } from './_core/llm.js';
import bcrypt from 'bcrypt';
import { sign } from './_core/jwt.js';
import { bookingRemindersRouter } from './routers.booking-reminders.js';
import { dataExportRouter } from './routers.data-export.js';
import { autoRemindersRouter } from './routers.auto-reminders.js';
import { startBookingCalendarSync, stopBookingCalendarSync, manualSyncBookingCalendar } from './_core/booking-ical-sync.js';
import { eq } from 'drizzle-orm';


// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  bookingReminders: bookingRemindersRouter,
  dataExport: dataExportRouter,
  autoReminders: autoRemindersRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 從數據庫查詢用戶
        const user = await db.getUserByUsername(input.username);
        
        if (!user || user.role !== 'admin') {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
        }
        
        // 驗證密碼
        if (!user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
        }
        
        const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
        if (!passwordMatch) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
        }
        
        // 更新最後登入時間
        await db.updateUserLastSignedIn(user.id);
        
        // 生成 JWT token
        const token = sign({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        });
        
        // 設置 cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          },
        };
      }),
    
    // 帳號管理 API
    listAdmins: adminProcedure.query(async () => {
      const allUsers = await db.getAllUsers();
      return allUsers.filter(u => u.role === 'admin').map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        status: u.status,
        createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn,
      }));
    }),
    
    createAdmin: adminProcedure
      .input(z.object({
        username: z.string().min(3, '用戶名至少3個字符'),
        password: z.string().min(6, '密碼至少6個字符'),
        name: z.string().min(1, '名稱不能為空'),
      }))
      .mutation(async ({ input }) => {
        // 檢查用戶名是否已存在
        const existingUser = await db.getUserByUsername(input.username);
        if (existingUser) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '用戶名已存在' });
        }
        
        // 加密密碼
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // 創建新用戶
        const userId = await db.upsertUser({
          username: input.username,
          passwordHash,
          name: input.name,
          role: 'admin',
          loginMethod: 'password',
        });
        
        // 返回新建用戶信息
        const newUser = await db.getUserById(userId);
        return { 
          success: true,
          user: newUser,
          message: `成功新增管理員帳號：${input.username}`
        };
      }),
    
    updateAdmin: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        password: z.string().min(6, '密碼至少6個字符').optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        
        if (input.name) updateData.name = input.name;
        if (input.status) updateData.status = input.status;
        if (input.password) {
          updateData.passwordHash = await bcrypt.hash(input.password, 10);
        }
        
        await db.updateUser(input.id, updateData);
        return { success: true };
      }),
    
    deleteAdmin: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),
  }),

  upload: router({
    image: protectedProcedure
      .input(z.object({
        filename: z.string(),
        data: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const buffer = Buffer.from(input.data, 'base64');
          const key = `room-images/${ctx.user.id}/${Date.now()}-${input.filename}`;
          const result = await storagePut(key, buffer, 'image/jpeg');
          return { success: true, url: result.url, key: result.key };
        } catch (error) {
          console.error('Upload error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Upload failed' });
        }
      }),
  }),

  // Room Types
  roomTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAvailableRoomTypes();
    }),
    
    listAll: adminProcedure.query(async () => {
      return await db.getAllRoomTypes();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const roomType = await db.getRoomTypeById(input.id);
        if (!roomType) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Room type not found' });
        }
        return roomType;
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameEn: z.string().optional(),
        description: z.string(),
        descriptionEn: z.string().optional(),
        size: z.string().optional(),
        capacity: z.number().default(2),
        price: z.string(),
        weekendPrice: z.string().optional(),
        images: z.string().optional(),
        amenities: z.string().optional(),
        displayOrder: z.number().default(0),
        maxSalesQuantity: z.number().default(10),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRoomType(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        size: z.string().optional(),
        capacity: z.number().optional(),
        price: z.string().optional(),
        weekendPrice: z.string().optional(),
        images: z.string().optional(),
        amenities: z.string().optional(),
        isAvailable: z.boolean().optional(),
        displayOrder: z.number().optional(),
        maxSalesQuantity: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRoomType(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRoomType(input.id);
        return { success: true };
      }),
    
    uploadImage: adminProcedure
      .input(z.object({
        imageBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const clientId = process.env.IMGUR_CLIENT_ID || "placeholder_client_id";
        if (clientId === "placeholder_client_id") {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Imgur Client ID not configured',
          });
        }
        try {
          const { uploadToImgur } = await import('../_core/imgur');
          const result = await uploadToImgur(input.imageBase64, clientId);
          return { url: result.url, deleteHash: result.deleteHash };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Image upload failed: ${error.message}`,
          });
        }
      }),
  }),

  // Bookings
  bookings: router({
    create: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        guestName: z.string(),
        guestEmail: z.string().email().optional(),
        guestPhone: z.string(),
        checkInDate: z.union([z.date(), z.string()]),
        checkOutDate: z.union([z.date(), z.string()]),
        numberOfGuests: z.number().default(2),
        totalPrice: z.string(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Convert string dates to Date objects if needed
        // Parse dates in YYYY-MM-DD format to avoid timezone issues
        const parseDate = (dateInput: string | Date): Date => {
          if (typeof dateInput === 'string') {
            const parts = dateInput.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
          }
          return dateInput;
        };
        
        const checkInDate = parseDate(input.checkInDate);
        const checkOutDate = parseDate(input.checkOutDate);
        // Check room availability
        const isAvailable = await db.checkRoomAvailability(
          input.roomTypeId,
          checkInDate,
          checkOutDate
        );
        
        if (!isAvailable) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Room is not available for selected dates' 
          });
        }
        
        // Check max sales quantity for each date
        const canBook = await db.checkMaxSalesQuantity(
          input.roomTypeId,
          checkInDate,
          checkOutDate
        );
        
        if (!canBook) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Reached maximum sales quantity for selected dates' 
          });
        }
        
        const bookingData = {
          ...input,
          checkInDate,
          checkOutDate,
          userId: ctx.user?.id,
          status: "pending" as const,
        };
        
        const id = await db.createBooking(bookingData);
        
        // Get room type information for email
        const roomType = await db.getRoomTypeById(input.roomTypeId);
        
        // Send confirmation email to guest
        if (input.guestEmail) {
          // Get base URL from request headers or use default
const baseUrl = process.env.API_URL || 'http://localhost:3000';          const guestEmailHtml = generateBookingConfirmationEmail(
            input.guestName,
            roomType?.name || '房型',
            checkInDate,
            checkOutDate,
            input.numberOfGuests,
            input.totalPrice,
            id,
            input.specialRequests,
            baseUrl
          );
          await sendEmail(
            input.guestEmail,
            `訂房確認 - 歐堡商務汽車旅館 (訂房編號: #${id})`,
            guestEmailHtml
          );
        }
        
        // Send notification email to admin
        const adminEmail = 'jason88488848@gmail.com';  // 测試用 email
        if (adminEmail) {
          const adminEmailHtml = generateAdminNotificationEmail(
            input.guestName,
            input.guestEmail || '未提供',
            input.guestPhone,
            roomType?.name || '房型',
            checkInDate,
            checkOutDate,
            input.numberOfGuests,
            input.totalPrice,
            id,
            input.specialRequests
          );
          await sendEmail(
            adminEmail,
            `新訂房通知 - ${input.guestName} (訂房編號: #${id})`,
            adminEmailHtml
          );
        }
        
        // Notify owner about new booking (existing notification system)
        await notifyOwner({
          title: '新訂房通知',
          content: `收到新的訂房申請\n房型：${roomType?.name}\n入住日期：${checkInDate.toLocaleDateString()}\n退房日期：${checkOutDate.toLocaleDateString()}\n訂房人：${input.guestName}\n聯絡電話：${input.guestPhone}`,
        });
        
        return { id, success: true };
      }),
    
    checkAvailability: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        checkInDate: z.union([z.date(), z.string()]),
        checkOutDate: z.union([z.date(), z.string()]),
      }))
      .query(async ({ input }) => {
        const parseDate = (dateInput: string | Date): Date => {
          if (typeof dateInput === 'string') {
            const parts = dateInput.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            return new Date(year, month - 1, day);
          }
          return dateInput;
        };
        
        const checkInDate = parseDate(input.checkInDate);
        const checkOutDate = parseDate(input.checkOutDate);
        
        const isAvailable = await db.checkRoomAvailability(
          input.roomTypeId,
          checkInDate,
          checkOutDate
        );
        return { isAvailable };
      }),
    
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        // 獲取房型名稱
        const roomType = await db.getRoomTypeById(booking.roomTypeId);
        
        return {
          ...booking,
          roomTypeName: roomType?.name || '未知房型',
          guests: booking.numberOfGuests,
        };
      }),
    
    list: adminProcedure.query(async () => {
      const bookings = await db.getAllBookings();
      // 添加 numberOfGuests 欄位以修復人數顯示
      return bookings.map((booking: any) => ({
        ...booking,
        numberOfGuests: booking.numberOfGuests || 2, // 預設值 2
      }));
    }),
    
    getByPhone: publicProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        const bookings = await db.getBookingsByPhone(input.phone);
        
        // 獲取房型信息
        const bookingsWithRoomName = await Promise.all(
          bookings.map(async (booking: any) => {
            const roomType = await db.getRoomTypeById(booking.roomTypeId);
            return {
              ...booking,
              roomName: roomType?.name || '未知房型',
            };
          })
        );
        
        return bookingsWithRoomName;
      }),
    
    cancel: publicProcedure
      .input(z.object({ 
        id: z.number(),
        phone: z.string(),
      }))
      .mutation(async ({ input }) => {
        // 驗證訂單存在且電話號碼匹配
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        if (booking.guestPhone !== input.phone) {
          throw new TRPCError({ code: 'FORBIDDEN', message: '電話號碼不匹配' });
        }
        
        // 只能取消待確認或已確認的訂單
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: '只能取消待確認或已確認的訂單' 
          });
        }
        
        // 更新狀態為已取消
        await db.updateBookingStatus(input.id, 'cancelled');
        
        // 發送取消確認郵件給客戶
        if (booking.guestEmail) {
          const cancellationEmailHtml = generateBookingCancelledEmail(
            booking.guestName,
            booking.id
          );
          await sendEmail(
            booking.guestEmail,
            `訂房已取消 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`,
            cancellationEmailHtml
          );
        }
        
        // 通知管理員
        const roomType = await db.getRoomTypeById(booking.roomTypeId);
        await notifyOwner({
          title: '訂單已取消',
          content: `客人 ${booking.guestName} 已取消訂單\n房型：${roomType?.name}\n入住日期：${new Date(booking.checkInDate).toLocaleDateString('zh-TW')}`,
        });
        
        return { success: true };
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "pending_payment", "paid", "completed", "cancelled"]),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        await db.updateBookingStatus(input.id, input.status);
        
        const roomType = await db.getRoomTypeById(booking.roomTypeId);
        const guestEmail = booking.guestEmail;
        
        // Send status change emails to customer
        if (guestEmail) {
          let emailHtml = '';
          let emailSubject = '';
          
          switch (input.status) {
            case 'confirmed':
              emailHtml = generateBookingConfirmedEmail(
                booking.guestName,
                booking.id,
                roomType?.name || '房型',
                booking.checkInDate,
                booking.checkOutDate,
                booking.totalPrice.toString()
              );
              emailSubject = `訂房已確認 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`;
              break;
              
            case 'pending_payment':
              emailHtml = generatePaymentInstructionEmail(
                booking.guestName,
                booking.id,
                booking.totalPrice.toString(),
                input.bankName || '台灣銀行',
                input.accountNumber || '123-456-789',
                input.accountName || '歐堡商務汽車旅館'
              );
              emailSubject = `付款指示 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`;
              break;
              
            case 'paid':
              emailHtml = generatePaymentConfirmedEmail(
                booking.guestName,
                booking.id,
                booking.totalPrice.toString(),
                booking.checkInDate
              );
              emailSubject = `付款已確認 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`;
              break;
              
            case 'completed':
              emailHtml = generateBookingCompletedEmail(
                booking.guestName,
                booking.id,
                booking.checkOutDate
              );
              emailSubject = `訂房已完成 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`;
              break;
              
            case 'cancelled':
              emailHtml = generateBookingCancelledEmail(
                booking.guestName,
                booking.id
              );
              emailSubject = `訂房已取消 - 歐堡商務汽車旅館 (訂房編號: #${booking.id})`;
              break;
          }
          
          if (emailHtml) {
            await sendEmail(guestEmail, emailSubject, emailHtml);
          }
        }
        
        // Notify owner about status change
        const statusLabels: Record<string, string> = {
          confirmed: '已確認',
          pending_payment: '待付款',
          paid: '已付款',
          completed: '已完成',
          cancelled: '已取消',
        };
        
        await notifyOwner({
          title: `訂房狀態變更：${statusLabels[input.status] || input.status}`,
          content: `訂房編號 #${booking.id}\n房型：${roomType?.name}\n入住日期：${booking.checkInDate.toLocaleDateString('zh-TW')}\n退房日期：${booking.checkOutDate.toLocaleDateString('zh-TW')}\n訂房人：${booking.guestName}\n新狀態：${statusLabels[input.status] || input.status}`,
        });
        
        return { success: true };
      }),

    // 删除訂單
    deleteBooking: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        await db.deleteBooking(input.id);
        return { success: true };
      }),
    
    // 快速操作：確認訂房
    confirmBooking: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.id, "confirmed");
        
        const booking = await db.getBookingById(input.id);
        if (booking) {
          const roomType = await db.getRoomTypeById(booking.roomTypeId);
          await notifyOwner({
            title: '訂房已確認',
            content: `訂房已確認\n房型：${roomType?.name}\n入住日期：${booking.checkInDate.toLocaleDateString()}\n退房日期：${booking.checkOutDate.toLocaleDateString()}\n訂房人：${booking.guestName}\n聯絡電話：${booking.guestPhone}`,
          });
        }
        
        return { success: true };
      }),
    
    // 選擇支付方式
    selectPaymentMethod: adminProcedure
      .input(z.object({ 
        id: z.number(),
        method: z.enum(['bank_transfer', 'cash_on_site'])
      }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        console.log(`[selectPaymentMethod] 訂單 #${input.id} 當前狀態: ${booking.status}`);
        
        if (booking.status !== 'confirmed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `只有已確認的訂單才能選擇支付方式。當前狀態：${booking.status}` });
        }
        
        // 根據支付方式進入相應狀態
        const newStatus = input.method === 'cash_on_site' ? 'cash_on_site' : 'pending_payment';
        console.log(`[selectPaymentMethod] 更新訂單 #${input.id} 狀態為: ${newStatus}`);
        
        await db.updateBookingStatus(input.id, newStatus);
        
        const updatedBooking = await db.getBookingById(input.id);
        console.log(`[selectPaymentMethod] 訂單 #${input.id} 更新後狀態: ${updatedBooking?.status}`);
        
        if (updatedBooking) {
          const roomType = await db.getRoomTypeById(updatedBooking.roomTypeId);
          if (input.method === 'cash_on_site') {
            await notifyOwner({
              title: '訂房已確認 - 現場支付',
              content: `訂房已確認，客人將於現場支付\n房型：${roomType?.name}\n入住日期：${updatedBooking.checkInDate.toLocaleDateString()}\n訂房人：${updatedBooking.guestName}`,
            });
          } else {
            await notifyOwner({
              title: '訂房已確認 - 待銀行轉帳',
              content: `訂房已確認，等待客人銀行轉帳\n房型：${roomType?.name}\n入住日期：${updatedBooking.checkInDate.toLocaleDateString()}\n訂房人：${updatedBooking.guestName}\n金額：NT${updatedBooking.totalPrice}`,
            });
          }
        }
        
        return { success: true };
      }),
    
    // 確認銀行轉帳後五碼
    confirmBankTransfer: adminProcedure
      .input(z.object({ 
        id: z.number(),
        lastFiveDigits: z.string().regex(/^\d{5}$/)
      }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        if (booking.status !== 'pending_payment') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '只有待付款的訂單才能確認銀行轉帳' });
        }
        
        // 更新為已付款狀態
        await db.updateBookingStatus(input.id, 'paid');
        
        const updatedBooking = await db.getBookingById(input.id);
        if (updatedBooking) {
          const roomType = await db.getRoomTypeById(updatedBooking.roomTypeId);
          await notifyOwner({
            title: '訂房已付款',
            content: `訂房已收到銀行轉帳\n房型：${roomType?.name}\n入住日期：${updatedBooking.checkInDate.toLocaleDateString()}\n訂房人：${updatedBooking.guestName}\n金額：NT${updatedBooking.totalPrice}\n後五碼：${input.lastFiveDigits}`,
          });
        }
        
        return { success: true };
      }),
    
    // 快速操作：標記入住
    markCheckedIn: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        
        // 只有已確認或已付款的訂單才能標記入住
        if (booking.status !== 'confirmed' && booking.status !== 'paid' && booking.status !== 'cash_on_site') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '只有已確認或已付款的訂單才能標記入住' });
        }
        
        await db.updateBookingStatus(input.id, "completed");
        
        const updatedBooking = await db.getBookingById(input.id);
        if (updatedBooking) {
          const roomType = await db.getRoomTypeById(updatedBooking.roomTypeId);
          await notifyOwner({
            title: '客人已入住',
            content: `客人已辦理入住\n房型：${roomType?.name}\n入住日期：${updatedBooking.checkInDate.toLocaleDateString()}\n訂房人：${updatedBooking.guestName}`,
          });
        }
        
        return { success: true };
      }),
    
    // 快速操作：發送郵件
    sendEmail: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        if (!booking.guestEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '該訂單沒有郵件地址' });
        }
        
        const roomType = await db.getRoomTypeById(booking.roomTypeId);
        const roomTypeName = roomType?.name || '未知房型';
        
        // TODO: 實際發送郵件逻輯（需要整合郵件服務）
        // 目前只通知管理員
        await notifyOwner({
          title: '已發送確認郵件',
          content: `已發送確認郵件給：${booking.guestEmail}\n房型：${roomTypeName}\n房價：NT$${roomType?.price || 0}\n入住日期：${booking.checkInDate.toLocaleDateString()}\n退房日期：${booking.checkOutDate.toLocaleDateString()}\n訂房人：${booking.guestName}\n總金額：NT$${booking.totalPrice}`,
        });
        
        return { success: true, message: '郵件已發送' };
      }),
    reconciliationReport: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const start = input.startDate ? new Date(input.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = input.endDate ? new Date(input.endDate) : new Date();

        // 獲取所有訂房
        const bookings = await db.getAllBookings();
        
        // 篩選日期範圍內的訂房
        const filteredBookings = bookings.filter(b => {
          const checkInDate = new Date(b.checkInDate);
          return checkInDate >= start && checkInDate <= end;
        });

        // 按狀態分組
        const byStatus = {
          pending: filteredBookings.filter(b => b.status === 'pending'),
          confirmed: filteredBookings.filter(b => b.status === 'confirmed'),
          pending_payment: filteredBookings.filter(b => b.status === 'pending_payment'),
          paid: filteredBookings.filter(b => b.status === 'paid'),
          completed: filteredBookings.filter(b => b.status === 'completed'),
          cancelled: filteredBookings.filter(b => b.status === 'cancelled'),
        };

        // 計算統計數據
        const stats = {
          total: filteredBookings.length,
          totalAmount: filteredBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0),
          pending: byStatus.pending.length,
          confirmed: byStatus.confirmed.length,
          pending_payment: byStatus.pending_payment.length,
          paid: byStatus.paid.length,
          completed: byStatus.completed.length,
          cancelled: byStatus.cancelled.length,
          paidAmount: byStatus.paid.reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0),
          unpaidAmount: [...byStatus.pending, ...byStatus.confirmed, ...byStatus.pending_payment]
            .reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0),
        };

        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          stats,
          bookings: filteredBookings,
          byStatus,
        };
      }),
  }),

  // News
  news: router({
    list: publicProcedure.query(async () => {
      return await db.getAllNews();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const newsItem = await db.getNewsById(input.id);
        if (!newsItem) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'News not found' });
        }
        return newsItem;
      }),
    
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        titleEn: z.string().optional(),
        content: z.string(),
        contentEn: z.string().optional(),
        type: z.enum(["announcement", "promotion", "event"]).default("announcement"),
        coverImage: z.string().optional(),
        image: z.string().optional(),
        isPublished: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNews(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleEn: z.string().optional(),
        content: z.string().optional(),
        image: z.string().optional(),
        contentEn: z.string().optional(),
        type: z.enum(["announcement", "promotion", "event"]).optional(),
        coverImage: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateNews(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNews(input.id);
        return { success: true };
      }),
  }),

  // Facilities
  facilities: router({
    list: publicProcedure.query(async () => {
      return await db.getAllFacilities();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameEn: z.string().optional(),
        description: z.string(),
        descriptionEn: z.string().optional(),
        icon: z.string().optional(),
        images: z.string().optional(),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createFacility(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        icon: z.string().optional(),
        images: z.string().optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFacility(id, data);
        return { success: true };
      }),
  }),

  // AI Chat
  chat: router({
    ask: publicProcedure
      .input(z.object({
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Get all room types and facilities for context
          const rooms = await db.getAllRoomTypes();
          const facilities = await db.getAllFacilities();
          
          // Build context for the AI
          const roomsContext = rooms.map(r => `${r.name}: NT$${r.price}/晚, 容納${r.capacity}人`).join('\n');
          const facilitiesContext = facilities.map(f => f.name).join(', ');
          
          const systemPrompt = `你是歐堡商務汽車旅館的 AI 客服助手。旅館位於台南市新營區長榮路一段41號，電話06-635-9577。

可用房型：
${roomsContext}

設施：${facilitiesContext}

請用繁體中文回答訪客的問題。如果問題超出範圍，請禮貌地建議訪客聯絡旅館。`;
          
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...(input.history || []),
            { role: 'user' as const, content: input.message },
          ];
          
          const response = await invokeLLM({ messages });
          const reply = response.choices[0]?.message?.content || '抱歉，我無法回答您的問題。';
          
          return { reply };
        } catch (error) {
          console.error('Chat error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Chat service unavailable' });
        }
      }),
  }),

  // Room Availability Management
  roomAvailability: router({
    // Check availability for booking
    checkAvailability: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
      }))
      .query(async ({ input }) => {
        const checkIn = new Date(input.checkInDate);
        const checkOut = new Date(input.checkOutDate);
        
        const isAvailable = await db.checkRoomAvailability(
          input.roomTypeId,
          checkIn,
          checkOut
        );
        
        // 獲取房型信息
        const roomType = await db.getRoomTypeById(input.roomTypeId);
        const maxQuantity = roomType?.maxSalesQuantity || 10;
        
        // 獲取該日期範圍內的訂單數量
        const bookings = await db.getBookingsByRoomAndDateRange(
          input.roomTypeId,
          checkIn,
          checkOut
        );
        
        const bookedCount = bookings.filter(
          (b: any) => b.status !== 'cancelled'
        ).length;
        
        const available = Math.max(0, maxQuantity - bookedCount);
        
        return { 
          isAvailable: available > 0,
          available,
          maxQuantity,
          bookedCount,
        };
      }),
    
    // Get availability for a specific room type and date range
    getByRoomAndDateRange: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getRoomAvailabilityByDateRange(
          input.roomTypeId,
          input.startDate,
          input.endDate
        );
      }),
    
    // Set availability for specific dates (batch operation)
    setAvailability: adminProcedure
      .input(z.object({
        roomTypeId: z.number(),
        dates: z.array(z.date()),
        isAvailable: z.boolean(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.setRoomAvailability(
          input.roomTypeId,
          input.dates,
          input.isAvailable,
          input.reason
        );
        return { success: true };
      }),
    
    // Get all unavailable dates for a room type (for calendar display)
    getUnavailableDates: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getUnavailableDates(input.roomTypeId);
      }),
    
    updateMaxSalesQuantity: adminProcedure
      .input(z.object({
        roomTypeId: z.number(),
        date: z.date(),
        maxSalesQuantity: z.number().min(0).max(100),
      }))
      .mutation(async ({ input }) => {
        await db.updateMaxSalesQuantity(
          input.roomTypeId,
          input.date,
          input.maxSalesQuantity
        );
        return { success: true };
      }),
    
    updateDynamicPrice: adminProcedure
      .input(z.object({
        roomTypeId: z.number(),
        date: z.date(),
        weekdayPrice: z.number().positive().optional(),
        weekendPrice: z.number().positive().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDynamicPrice(
          input.roomTypeId,
          input.date,
          input.weekdayPrice,
          input.weekendPrice
        );
        return { success: true };
      }),
  }),

  // Home Config
  homeConfig: router({
    get: publicProcedure.query(async () => {
      return await db.getHomeConfig();
    }),
    
    update: adminProcedure
      .input(z.object({
        carouselImages: z.string().optional(),
        vipGarageImage: z.string().optional(),
        deluxeRoomImage: z.string().optional(),
        facilitiesImage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateHomeConfig(input);
        return { success: true };
      }),
  }),

  // Contact Messages
  contact: router({
    send: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createContactMessage(input);
        
        // Notify owner about new contact message
        await notifyOwner({
          title: '新聯絡訊息',
          content: `收到新的聯絡訊息\n姓名：${input.name}\nEmail：${input.email}\n主旨：${input.subject || '無'}\n訊息：${input.message}`,
        });
        
        return { id, success: true };
      }),
    
    list: adminProcedure.query(async () => {
      return await db.getAllContactMessages();
    }),
    
    markAsRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markMessageAsRead(input.id);
        return { success: true };
      }),
  }),

  // Featured Services Management
  featuredServices: router({
    list: publicProcedure.query(async () => {
      return await db.getAllFeaturedServices();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const service = await db.getFeaturedServiceById(input.id);
        if (!service) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Featured service not found' });
        }
        return service;
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        titleEn: z.string().optional(),
        description: z.string(),
        descriptionEn: z.string().optional(),
        image: z.string().optional(),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const service = await db.createFeaturedService(input);
        if (!service) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create featured service' });
        }
        return service;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        image: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFeaturedService(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFeaturedService(input.id);
        return { success: true };
      }),
  }),



  accounts: router({
    list: adminProcedure
      .query(async () => {
        return await db.getAllUsers();
      }),

    create: adminProcedure
      .input(z.object({
        username: z.string().min(3).max(64),
        name: z.string().min(1).max(100),
        role: z.enum(['user', 'admin']),
        password: z.string().min(6).max(128),
      }))
      .mutation(async ({ input }) => {
        // Check if username already exists
        const existing = await db.getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create user with password
        await db.upsertUser({
          username: input.username,
          name: input.name,
          role: input.role,
          passwordHash,
          loginMethod: 'username',
          lastSignedIn: new Date(),
        });

        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        role: z.enum(['user', 'admin']).optional(),
        password: z.string().min(6).max(128).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, password, ...data } = input;
        
        // If password is provided, hash it
        if (password) {
          const passwordHash = await bcrypt.hash(password, 10);
          await db.updateUser(id, { ...data, passwordHash });
        } else {
          await db.updateUser(id, data);
        }
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),

    toggleStatus: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Get all users and find the one with matching id
        const allUsers = await db.getAllUsers();
        const user = allUsers.find(u => u.id === input.id);
        
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }
        
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        await db.updateUser(input.id, { status: newStatus });
        
        return { success: true, status: newStatus };
      }),
  }),

  
  // 房間控管系統 - iCal同步用
  roomBlockage: router({
    // 添加房間關閉日期
    blockDates: adminProcedure
      .input(z.object({
        roomTypeId: z.number(),
        dates: z.array(z.date()),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // 儲存關閉日期到資料庫
        const blockageId = await db.createRoomBlockage(input.roomTypeId, input.dates, input.reason);
        return { success: true, message: `已關閉房型 ${input.roomTypeId} 的 ${input.dates.length} 個日期`, blockageId };
      }),
    // 移除房間關閉日期
    unblockDates: adminProcedure
      .input(z.object({
        roomTypeId: z.number(),
        dates: z.array(z.date()),
      }))
      .mutation(async ({ input }) => {
        // 移除資料庫中的關閉記錄
        await db.deleteRoomBlockage(input.roomTypeId, input.dates);
        return { success: true, message: `已開啟房型 ${input.roomTypeId} 的 ${input.dates.length} 個日期` };
      }),
    // 取得房間關閉狀態
    getBlockedDates: publicProcedure
      .input(z.object({ roomTypeId: z.number() }))
      .query(async ({ input }) => {
        // TODO: 從資料庫查詢關閉日期
        const blockedDates = await db.getBlockedDatesInRange(input.roomTypeId, new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
        return blockedDates;
      }),
    // 批量檢查日期是否被關閉
    checkBlockedDates: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        dates: z.array(z.date()),
      }))
      .query(async ({ input }) => {
        // TODO: 檢查是否有任何日期被關閉
        const blockedDates: Date[] = [];
        for (const date of input.dates) {
          const isBlocked = await db.isDateBlocked(input.roomTypeId, date);
          if (isBlocked) {
            blockedDates.push(date);
          }
        }
        return blockedDates;
      }),
  }),

  // 儀表板數據
  dashboard: router({
    getStats: protectedProcedure.query(async () => {
      try {
        const allBookings = await db.getAllBookings();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 今日入住
        const todayCheckIns = allBookings.filter((b: any) => {
          const checkInDate = new Date(b.checkInDate);
          checkInDate.setHours(0, 0, 0, 0);
          return checkInDate.getTime() === today.getTime() && b.status === 'confirmed';
        }).length;
        
        // 待確認訂單
        const pendingBookings = allBookings.filter((b: any) => b.status === 'pending').length;
        
        // 已確認訂單
        const confirmedBookings = allBookings.filter((b: any) => b.status === 'confirmed').length;
        
        // 本月營收
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthRevenue = allBookings
          .filter((b: any) => {
            const createdDate = new Date(b.createdAt);
            return createdDate >= monthStart && createdDate < monthEnd && b.status === 'confirmed';
          })
          .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        
        return {
          todayCheckIns,
          pendingBookings,
          confirmedBookings,
          monthRevenue: Math.round(monthRevenue),
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          todayCheckIns: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          monthRevenue: 0,
        };
      }
    }),
  }),

  // Booking.com iCal 同步
  iCalSync: router({
    // 手動触發同步
    syncNow: adminProcedure
      .mutation(async () => {
        return await manualSyncBookingCalendar();
      }),
    // 启動自動同步
    start: adminProcedure
      .mutation(async () => {
        startBookingCalendarSync();
        return { success: true, message: 'iCal 同步已啟動' };
      }),
    // 停止自動同步
    stop: adminProcedure
      .mutation(async () => {
        stopBookingCalendarSync();
        return { success: true, message: 'iCal 同步已停止' };
      }),
  }),
});

export type AppRouter = typeof appRouter;
        
