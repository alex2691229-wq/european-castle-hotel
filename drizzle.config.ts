import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// 移除所有 ssl 相關參數
const cleanUrl = connectionString
  .replace(/[?&](ssl|sslMode)=[^&]*/g, '')
  .replace(/\?$/, '');

export default defineConfig<Config>({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: cleanUrl,
    ssl: "amazon", // TiDB 使用 amazon SSL
  },
  casing: "snake_case",
});
