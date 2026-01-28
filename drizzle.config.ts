import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// 確保 SSL 參數存在
const urlWithSSL = connectionString.includes('ssl=') 
  ? connectionString 
  : connectionString + (connectionString.includes('?') ? '&' : '?') + 'ssl=amazon';

export default defineConfig<Config>({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: urlWithSSL,
  },
  casing: "camelCase",
});
