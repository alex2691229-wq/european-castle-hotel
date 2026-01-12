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
        
        const bookingData = {
          ...input,
          userId: ctx.user?.id,
          status: "pending" as const,
        };
        
        const id = await db.createBooking(bookingData);
        
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
    
    list: adminProcedure.query(async () => {
      return await db.getAllBookings();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Only admin or booking owner can view
        if (ctx.user.role !== 'admin' && booking.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        return booking;
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
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getUnavailableDates(
          input.roomTypeId,
          input.startDate,
          input.endDate
        );
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
        const service = await db.updateFeaturedService(id, data);
        if (!service) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update featured service' });
        }
        return service;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteFeaturedService(input.id);
        if (!success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete featured service' });
        }
        return { success: true };
      }),
  }),


});

export type AppRouter = typeof appRouter;
