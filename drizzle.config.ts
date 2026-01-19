import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// 移除 ssl=true 參數（drizzle-kit 使用 ssl 配置對象）
// 移除 ssl=true 參數（drizzle-kit 使用 ssl 配置對象）
const cleanUrl = connectionString.replace(/[?&]ssl=true/g, '');

export default defineConfig<Config>({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: cleanUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
