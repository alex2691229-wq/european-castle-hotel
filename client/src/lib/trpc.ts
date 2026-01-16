import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

// 修復後的 API 連線設定
export const getBaseUrl = () => {
  // 優先讀取環境變數，如果沒有，就連到後端 Cloud Run 網址
  const VITE_API_URL = import.meta.env.VITE_API_URL;
  if (VITE_API_URL) return VITE_API_URL;
  
  // 這是你的後端地址，直接寫死在這裡當作保險
  return "https://j4lgdbyk5e-tcqganzzma-uk.a.run.app";
};

export const trpc = createTRPCReact<AppRouter>();
export const API_URL = getBaseUrl();