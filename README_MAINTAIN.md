# 歐堡商務汽車旅館 - 維護指南

## 系統概述

本文件記錄成功部署至 Vercel 的穩定配置，供後續維護參考。

**系統版本**：Production v1.0 (Stable)
**部署平台**：Vercel
**最後更新**：2026-01-19

---

## 核心技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 前端 | React + TypeScript | 18.x |
| 後端 | Node.js + Express + TRPC | 20.x |
| 構建工具 | Vite + esbuild | 5.x |
| 資料庫 | MySQL | 8.0+ |
| 部署 | Vercel | - |

---

## Vercel 部署配置

### 必要設定

**Root Directory**：`None`（根目錄）

**Build Command**：
```bash
npm run build
```

**Output Directory**：`dist/public`

### 環境變數（必須）

| 變數名 | 說明 | 範例 |
|--------|------|------|
| `DATABASE_URL` | MySQL 連接字串 | `mysql://user:pass@host/db` |
| `JWT_SECRET` | JWT 簽名密鑰 | 長度 ≥ 32 字元 |
| `NODE_ENV` | 執行環境 | `production` |
| `PORT` | 伺服器端口 | `3000` |

### 構建流程

```
npm run build
├── vite build (前端)
│   └── 輸出：client/dist → dist/public
└── esbuild (後端)
    └── 輸出：server/_core/index.ts → dist/index.js
```

**輸出結構**：
```
dist/
├── public/          # 前端靜態資源 + 編譯後的 HTML/JS/CSS
├── index.js         # 後端伺服器入口
└── ...
```

---

## 後端 API 架構

### 認證系統

**登入端點**：`POST /api/login`

```json
{
  "username": "admin",
  "password": "123456"
}
```

**回應**：
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### API 路由

| 路由 | 方法 | 說明 |
|------|------|------|
| `/api/login` | POST | 管理員登入 |
| `/api/status` | GET | 後端健康檢查 |
| `/trpc/*` | POST | TRPC 路由（儀表板、訂房、客房） |

### CORS 配置

已配置允許所有來源的 CORS 請求：
```typescript
// server/_core/index.ts
app.use(cors());
```

---

## 版本標記

### 內部識別標記

**Navbar 版本標記**：`v2.0-Verified`
- 位置：`client/src/components/Navbar.tsx`
- 用途：內部版本識別

**部署同步標記**：`DEPLOY_SYNC_ID`
- 位置：`client/src/pages/Home.tsx` 和 `client/src/pages/Login.tsx`
- 用途：確保前後端版本同步

---

## 功能清單

### 已實現功能

- ✅ 管理員登入系統（REST API）
- ✅ 儀表板（4 面板指標）
- ✅ 訂房管理
- ✅ 客房管理
- ✅ 內容管理
- ✅ 後端健康檢查端點
- ✅ TRPC API 集成
- ✅ JWT 身份驗證
- ✅ 資料庫連接

### 測試帳號

| 帳號 | 密碼 | 角色 |
|------|------|------|
| `admin` | `123456` | 管理員 |

---

## 常見維護任務

### 1. 部署新版本

```bash
# 本地測試
npm run build
npm run preview

# 推送至 GitHub（自動觸發 Vercel 部署）
git add .
git commit -m "RELEASE: v1.x - Description"
git push origin main
```

### 2. 更新環境變數

1. 登入 Vercel 控制面板
2. 進入專案 → Settings → Environment Variables
3. 修改或新增變數
4. 重新部署

### 3. 資料庫遷移

```bash
# 本地遷移
pnpm db:push

# 驗證
pnpm db:studio
```

### 4. 檢查後端狀態

```bash
curl https://your-vercel-domain.com/api/status
```

預期回應：
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:00:00Z"
}
```

---

## 故障排除

### 問題：登入失敗

**檢查清單**：
1. 確認 `DATABASE_URL` 環境變數已設定
2. 確認 `JWT_SECRET` 環境變數已設定
3. 檢查資料庫連接是否正常
4. 查看伺服器日誌：`vercel logs`

### 問題：TRPC API 無法連接

**檢查清單**：
1. 確認 `VITE_HMR_HOST` 和 `VITE_HMR_PORT` 已正確配置
2. 檢查 CORS 設定是否允許前端域名
3. 驗證後端伺服器是否正常運行
4. 檢查瀏覽器控制台的網路請求

### 問題：構建失敗

**檢查清單**：
1. 確認 `npm run build` 在本地可成功執行
2. 檢查 `dist/public` 目錄是否正確生成
3. 驗證所有環境變數已設定
4. 查看 Vercel 構建日誌

---

## 重要檔案位置

| 檔案 | 用途 |
|------|------|
| `vercel.json` | Vercel 部署配置 |
| `vite.config.ts` | Vite 構建配置 |
| `server/_core/index.ts` | 後端伺服器入口 |
| `server/routers.ts` | TRPC 路由定義 |
| `client/src/lib/trpc.ts` | TRPC 客戶端配置 |
| `package.json` | 依賴和構建腳本 |
| `drizzle/schema.ts` | 資料庫架構 |

---

## 安全性建議

1. **環境變數**：所有敏感資訊（密碼、密鑰）應存儲在 Vercel 環境變數中，不要提交至版本控制
2. **JWT 密鑰**：定期輪換 `JWT_SECRET`
3. **資料庫**：使用強密碼，限制連接來源
4. **CORS**：生產環境應限制允許的來源，不要使用 `*`

---

## 聯繫與支援

如有問題，請參考以下資源：

- **Vercel 文件**：https://vercel.com/docs
- **TRPC 文件**：https://trpc.io/docs
- **Vite 文件**：https://vitejs.dev/guide/

---

**維護者**：開發團隊
**最後審查**：2026-01-19
