import { createTRPCReact } from "@trpc/react-query";

// 不要動態偵測了，直接指向那個「活著」的後端
export const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:3000";
  console.log('[TRPC] API URL:', url);
  return url;
};
export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
