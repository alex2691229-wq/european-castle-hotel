import { createTRPCReact } from "@trpc/react-query";

// API 連線設定 - 使用相對路徑，讓 Vercel 代理處理
export const getBaseUrl = () => "";
export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
