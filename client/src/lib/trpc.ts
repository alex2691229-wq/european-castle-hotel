import { createTRPCReact } from "@trpc/react-query";

// API 連線設定 - 直接連接到正常運行的後端
export const getBaseUrl = () => "https://j4lgdbyk5e-tcqganzzma-uk.a.run.app";
export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();
