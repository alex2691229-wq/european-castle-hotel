import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import bcrypt from "bcrypt";
import { sign } from "./_core/jwt";


// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
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
        const user = await db.getUserByUsername(input.username);
        
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
        }
        
        if (user.status === 'inactive') {
          throw new TRPCError({ code: 'FORBIDDEN', message: '帳戶已停用' });
        }
        
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        
        if (!isValid) {
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
  }),

  // Bookings
  bookings: router({
    create: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        guestName: z.string(),
        guestEmail: z.string().email().optional(),
        guestPhone: z.string(),
        checkInDate: z.date(),
        checkOutDate: z.date(),
        numberOfGuests: z.number().default(2),
        totalPrice: z.string(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check room availability
        const isAvailable = await db.checkRoomAvailability(
          input.roomTypeId,
          input.checkInDate,
          input.checkOutDate
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
          input.checkInDate,
          input.checkOutDate
        );
        
        if (!canBook) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Reached maximum sales quantity for selected dates' 
          });
        }
        
        const bookingData = {
          ...input,
          userId: ctx.user?.id,
          status: "pending" as const,
        };
        
        const id = await db.createBooking(bookingData);
        
        // Update booked quantity for each date
        // Note: This is handled by the booking creation itself
        // await db.updateBookedQuantity(input.roomTypeId, input.checkInDate, 1);
        
        // Notify owner about new booking
        const roomType = await db.getRoomTypeById(input.roomTypeId);
        await notifyOwner({
          title: '新訂房通知',
          content: `收到新的訂房申請\n房型：${roomType?.name}\n入住日期：${input.checkInDate.toLocaleDateString()}\n退房日期：${input.checkOutDate.toLocaleDateString()}\n訂房人：${input.guestName}\n聯絡電話：${input.guestPhone}`,
        });
        
        return { id, success: true };
      }),
    
    checkAvailability: publicProcedure
      .input(z.object({
        roomTypeId: z.number(),
        checkInDate: z.date(),
        checkOutDate: z.date(),
      }))
      .query(async ({ input }) => {
        const isAvailable = await db.checkRoomAvailability(
          input.roomTypeId,
          input.checkInDate,
          input.checkOutDate
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
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.id, input.status);
        
        // Notify owner about status change
        const booking = await db.getBookingById(input.id);
        if (booking && input.status === "cancelled") {
          const roomType = await db.getRoomTypeById(booking.roomTypeId);
          await notifyOwner({
            title: '訂房取消通知',
            content: `訂房已取消\n房型：${roomType?.name}\n入住日期：${booking.checkInDate.toLocaleDateString()}\n訂房人：${booking.guestName}`,
          });
        }
        
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
    
    // 快速操作：標記入住
    markCheckedIn: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.id, "completed");
        
        const booking = await db.getBookingById(input.id);
        if (booking) {
          const roomType = await db.getRoomTypeById(booking.roomTypeId);
          await notifyOwner({
            title: '客人已入住',
            content: `客人已辦理入住\n房型：${roomType?.name}\n入住日期：${booking.checkInDate.toLocaleDateString()}\n訂房人：${booking.guestName}`,
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
        
        // TODO: 實際發送郵件逻輯（需要整合郵件服務）
        // 目前只通知管理員
        await notifyOwner({
          title: '已發送確認郵件',
          content: `已發送確認郵件給：${booking.guestEmail}\n房型：${roomType?.name}\n入住日期：${booking.checkInDate.toLocaleDateString()}\n訂房人：${booking.guestName}`,
        });
        
        return { success: true, message: '郵件已發送' };
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

});

export type AppRouter = typeof appRouter;
