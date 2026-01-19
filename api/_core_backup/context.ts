import type { CreateExpressContextOptions } from '@trpc/server/adapters/express.js';
import type { User } from '../../drizzle/schema.js';
import { sdk } from './sdk.js';
import { verify } from './jwt.js';
import { COOKIE_NAME } from '@shared/const.js';

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 首先嘗試使用 Manus SDK 驗證（用於 Google 登入）
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // 如果 SDK 驗證失敗，嘗試驗證本地 JWT token
    try {
      const token = opts.req.cookies[COOKIE_NAME];
      console.log(`[AUTH] Cookie name: ${COOKIE_NAME}, Token exists: ${!!token}`);
      
      if (token) {
        const payload = verify(token);
        console.log(`[AUTH] JWT verified successfully for user: ${payload.username}`);
        
        // 將 JWT payload 轉換為 User 對象
        user = {
          id: payload.id,
          openId: `local-${payload.username || payload.id}`,
          username: payload.username || null,
          name: payload.name || null,
          email: null,
          role: payload.role || 'user',
          loginMethod: 'local',
          lastSignedIn: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as User;
      } else {
        console.log(`[AUTH] No token found in cookies`);
      }
    } catch (jwtError) {
      // JWT 驗證也失敗，用戶未認證
      console.log(`[AUTH] JWT verification failed:`, jwtError instanceof Error ? jwtError.message : jwtError);
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
