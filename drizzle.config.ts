import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv"; // 💡 移除了 import type { Config }

// 確保 Drizzle Kit 在命令列執行時能讀取到 .env 檔案
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("⚠️ 找不到 DATABASE_URL，請檢查 .env 檔案是否設定正確。");
}

// 借用 Node.js 內建的 URL 工具來安全拆解網址，避開 mysql2 的字串解析 Bug
const dbUrl = new URL(process.env.DATABASE_URL);

// 💡 這裡把 defineConfig<Config> 改成了單純的 defineConfig
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "4000"), // TiDB 雲端資料庫的 Port
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),    // 移除路徑最前面的斜線
    ssl: {
      rejectUnauthorized: true,           // 正確的雲端 SSL 設定物件
    },
  },
  // 移除全局 casing 設置，使用手動列名映射
});