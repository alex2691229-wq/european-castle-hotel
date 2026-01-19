import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from './context.js';

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // 權限驗證已移除 - 所有人都可以訪問
  const mockUser = { id: 'admin', name: '管理員', email: 'admin@example.com', role: 'admin' as const };

  return next({
    ctx: {
      ...ctx,
      user: mockUser,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // 權限驗證已移除 - 所有人都是管理員
    const mockUser = { id: 'admin', name: '管理員', email: 'admin@example.com', role: 'admin' as const };

    return next({
      ctx: {
        ...ctx,
        user: mockUser,
      },
    });
  }),
);
