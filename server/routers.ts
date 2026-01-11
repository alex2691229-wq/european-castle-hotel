import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";

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
});

export type AppRouter = typeof appRouter;
