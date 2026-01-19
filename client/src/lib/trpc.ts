import { createTRPCReact } from "@trpc/react-query";

// 安全的 API Base URL 配置
export function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // 瀏覽器端使用相對路徑
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
