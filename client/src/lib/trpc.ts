import { createTRPCReact } from "@trpc/react-query";

// 修復後的 API 連線設定
export const getBaseUrl = () => {
  // 1. 優先檢查環境變數
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http')) return envUrl;

  // 2. 如果是生產環境且沒有變數，回傳後端 Cloud Run 網址
  if (import.meta.env.PROD) {
    return "https://j4lgdbyk5e-tcqganzzma-uk.a.run.app";
  }

  // 3. 本地開發環境
  return "http://localhost:3000";};

export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
