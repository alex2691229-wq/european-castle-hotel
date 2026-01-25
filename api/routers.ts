import { publicProcedure, router, protectedProcedure } from './_core/trpc.js';
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
        console.log('[Auth] Checking login for user:', input.username);
        
        // 從數據庫查詢用戶
        const user = await db.getUserByUsername(input.username);
        console.log('[Auth] User found in DB:', !!user);
        
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

  // Room Types - 只保留 list 端點
  roomTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRoomTypes();
    }),
    
    // TODO: 其他房型功能暫時註解，待後續添加
    // listAll: adminProcedure.query(async () => { ... }),
    // getById: publicProcedure.input(...).query(...),
    // create: adminProcedure.input(...).mutation(...),
    // update: adminProcedure.input(...).mutation(...),
    // delete: adminProcedure.input(...).mutation(...),
  }),

  // TODO: 以下功能暫時註解，待後續添加
  // upload: router({ ... }),
  // news: router({ ... }),
  // facilities: router({ ... }),
  // bookings: router({ ... }),
  // availability: router({ ... }),
  // admin: router({ ... }),
  // contacts: router({ ... }),
  // featuredServices: router({ ... }),
  // users: router({ ... }),
  // blockages: router({ ... }),
  // bookingCalendar: router({ ... }),
});
