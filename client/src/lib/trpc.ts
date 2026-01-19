import { createTRPCReact } from "@trpc/react-query";
import { httpBatchStreamLink } from '@trpc/client';
import { TRPCClientError } from '@trpc/client';
import superjson from 'superjson';

// 使用相對路徑，以便在不同環境中自動適配
export const getBaseUrl = () => import.meta.env.VITE_API_URL || "";
export const trpc = createTRPCReact<any>();
export const API_URL = getBaseUrl();

// TRPC 客戶端配置
export const trpcClient = trpc.createClient({
  links: [
    new TRPCClientError(),
  ],
});
