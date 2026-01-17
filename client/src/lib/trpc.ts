import { createTRPCReact } from "@trpc/react-query";

export const getBaseUrl = () => {
  // 優先檢查環境變數，如果沒有，則使用當前瀏覽器的網域
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  if (typeof window !== 'undefined') return window.location.origin;

  return 'http://localhost:5000';
};

export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
