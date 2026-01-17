import { createTRPCReact } from "@trpc/react-query";

// 修復後的 API 連線設定
export const getBaseUrl = () => "https://j4lgdbyk5e-tcqganzzma-uk.a.run.app";
export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
