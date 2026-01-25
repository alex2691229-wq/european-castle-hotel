import { router, publicProcedure, protectedProcedure } from './_core/trpc.js';
import { z } from 'zod';
import * as db from './db.js';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { sign } from './_core/jwt.js';
import { COOKIE_NAME } from './_shared/const.js';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

function getSessionCookieOptions(req: any) {
  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.input(z.void()).query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      // 清除 cookie - 使用 Set-Cookie header
      const cookieString = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
      ctx.res.setHeader('Set-Cookie', cookieString);
      return { success: true } as const;
    }),
    
    listAdmins: adminProcedure.query(async () => {
      console.log('[Auth] Fetching admin list...');
      try {
        // 返回所有 admin 用戶（暫時實現）
        return [];
      } catch (error) {
        console.error('[Auth] Error fetching admins:', error);
        return [];
      }
    }),
    
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          console.log('[Auth] Checking login for user:', input.username);
          
          // 從數據庫查詢用戶
          let user = await db.getUserByUsername(input.username);
          console.log('[Auth] User found in DB:', !!user);
          
          // Superdoor 邏輯：如果是 admin/123456 且用戶不存在，強制創建
          if (!user && input.username === 'admin' && input.password === '123456') {
            console.log('[Auth] Superdoor activated - Creating admin user');
            try {
              const hashedPassword = await bcrypt.hash(input.password, 10);
              await db.createUser({
                username: 'admin',
                passwordHash: hashedPassword,
                email: 'admin@hotel.com',
                name: 'Administrator',
                role: 'admin',
                loginMethod: 'password',
                status: 'active',
              });
              user = await db.getUserByUsername(input.username);
              console.log('[Auth] Admin user created via Superdoor');
            } catch (error) {
              console.error('[Auth] Superdoor creation failed:', error);
            }
          }
          
          if (!user) {
            console.log('[Auth] User not found:', input.username);
            throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
          }
          
          if (user.role !== 'admin') {
            console.log('[Auth] User is not admin, role:', user.role);
            throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
          }
          
          // 驗證密碼
          if (!user.passwordHash) {
            console.log('[Auth] User has no password hash');
            throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
          }
          
          console.log('[Auth] Comparing password for user:', input.username);
          const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
          console.log('[Auth] Password match result:', passwordMatch);
          
          if (!passwordMatch) {
            console.log('[Auth] Password mismatch for user:', input.username);
            throw new TRPCError({ code: 'UNAUTHORIZED', message: '用戶名或密碼錯誤' });
          }
          
          // 生成 JWT token
          const token = sign({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          });
          
          // 設置 cookie - 使用 Set-Cookie header（Vercel Serverless 兼容）
          const isSecure = ctx.req.headers['x-forwarded-proto'] === 'https' || ctx.req.secure || true;
          const cookieString = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${isSecure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=604800`;
          ctx.res.setHeader('Set-Cookie', cookieString);
          
          console.log('[Auth] Login successful for user:', input.username);
          return {
            success: true,
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
            },
          };
        } catch (error) {
          console.error('[Auth] Login error:', error);
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '登入失敗' });
        }
      }),
  }),

  roomTypes: router({
    list: publicProcedure.input(z.void()).query(async () => {
      return await db.getAllRoomTypes();
    }),
    
    getById: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        console.log('[RoomTypes] Fetching room by ID:', input.id);
        const room = await db.getRoomTypeById(input.id);
        if (!room) {
          console.log('[RoomTypes] Room not found:', input.id);
          throw new TRPCError({ code: 'NOT_FOUND', message: '房型不存在' });
        }
        console.log('[RoomTypes] Room found:', room.name);
        return room;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, '房型名稱不能為空'),
        nameEn: z.string().optional(),
        description: z.string().min(1, '房型描述不能為空'),
        descriptionEn: z.string().optional(),
        size: z.string().optional(),
        capacity: z.coerce.number().min(1, '容納人數至少為1'),
        price: z.coerce.number().min(0, '價格不能為負數'),
        weekendPrice: z.coerce.number().optional(),
        maxSalesQuantity: z.coerce.number().min(1, '最大銷售數量至少為1').default(10),
        images: z.string().optional(),
        amenities: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        console.log('[RoomTypes.create] Creating room with data:', JSON.stringify(input, null, 2));
        
        try {
          const result = await db.createRoomType({
            name: input.name,
            nameEn: input.nameEn,
            description: input.description,
            descriptionEn: input.descriptionEn,
            size: input.size,
            capacity: input.capacity,
            price: input.price.toString(),
            weekendPrice: input.weekendPrice?.toString(),
            maxSalesQuantity: input.maxSalesQuantity,
            images: input.images,
            amenities: input.amenities,
            isAvailable: true,
            displayOrder: 0,
          });
          
          console.log('[RoomTypes.create] Room created successfully:', result);
          return result;
        } catch (error) {
          console.error('[RoomTypes.create] Error creating room:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : '建立房型失敗',
          });
        }
      }),
  }),

  news: router({
    list: publicProcedure.input(z.void()).query(async () => {
      return await db.getAllNews();
    }),
  }),

  facilities: router({
    list: publicProcedure.input(z.void()).query(async () => {
      return await db.getAllFacilities();
    }),
  }),

  dashboard: router({
    getStats: adminProcedure.query(async () => {
      console.log('[Dashboard] Fetching statistics...');
      try {
        const roomCount = await db.getRoomTypeCount();
        const bookingCount = await db.getBookingCount();
        const newsCount = await db.getNewsCount();
        const facilityCount = await db.getFacilityCount();
        
        console.log('[Dashboard] Stats:', { roomCount, bookingCount, newsCount, facilityCount });
        
        return {
          roomCount: roomCount || 0,
          bookingCount: bookingCount || 0,
          newsCount: newsCount || 0,
          facilityCount: facilityCount || 0,
        };
      } catch (error) {
        console.error('[Dashboard] Error fetching stats:', error);
        return {
          roomCount: 0,
          bookingCount: 0,
          newsCount: 0,
          facilityCount: 0,
        };
      }
    }),

  bookings: router({
    list: adminProcedure.query(async () => {
      console.log('[Bookings] Fetching bookings...');
      try {
        // 返回空列表（暫時實現）
        return [];
      } catch (error) {
        console.error('[Bookings] Error fetching bookings:', error);
        return [];
      }
    }),
  }),

  homeConfig: router({
    get: publicProcedure.input(z.void()).query(async () => {
      console.log('[HomeConfig] Fetching home config...');
      try {
        return {
          title: '歐堡商務汽車旅館',
          description: '舒適、便利、親切的住宿體驗',
          logo: '/logo.png',
        };
      } catch (error) {
        console.error('[HomeConfig] Error fetching config:', error);
        return {
          title: '歐堡商務汽車旅館',
          description: '舒適、便利、親切的住宿體驗',
          logo: '/logo.png',
        };
      }
    }),
  }),
});

