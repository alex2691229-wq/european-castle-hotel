import { createTRPCReact } from "@trpc/react-query";

// 不要動態偵測了，直接指向那個「活著」的後端
export const getBaseUrl = () => import.meta.env.VITE_API_URL || "http://localhost:3000";
export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
