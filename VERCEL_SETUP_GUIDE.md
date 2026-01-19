# Vercel 部署設定指南 - 歐堡商務汽車旅館

## 專案結構說明

```
european-castle-hotel/（根目錄）
├── client/                    # 前端 React 應用
├── server/                    # 後端 Express 伺服器
├── drizzle/                   # 資料庫 Schema
├── package.json               # 根目錄 package.json
├── vercel.json                # Vercel 配置（根目錄）
└── vite.config.ts             # Vite 構建配置
```

## Vercel Dashboard 設定

### 1. Root Directory 設定
**應設為：`None`（根目錄）**

不要設為 `client`，因為後端代碼在根目錄的 `server/` 資料夾中。

### 2. Build Command
**使用預設值**（由 vercel.json 指定）
```
npm run build
```

此指令會：
1. 編譯前端（Vite）→ `dist/public/`
2. 編譯後端（esbuild）→ `dist/index.js`

### 3. Output Directory
**由 vercel.json 指定為：`dist/public`**

Vercel 會自動使用此目錄作為靜態文件輸出。

### 4. Install Command
**使用預設值**
```
npm install --legacy-peer-deps
```

## 環境變數設定

在 Vercel Dashboard → Settings → Environment Variables 中設置：

| 變數名稱 | 值 | 優先級 | 說明 |
|---------|-----|--------|------|
| DATABASE_URL | `postgresql://...` | **必須** | 資料庫連接字符串 |
| NODE_ENV | production | 建議 | 運行環境 |
| PORT | 3000 | 建議 | 伺服器端口 |
| JWT_SECRET | （任意強密碼） | 建議 | JWT 簽名密鑰 |
| OAUTH_SERVER_URL | https://api.manus.im | 可選 | OAuth 伺服器地址 |

## 構建流程

```
1. Vercel 檢測到 git push
2. 執行 npm install --legacy-peer-deps
3. 執行 npm run build
   ├─ vite build（前端）→ dist/public/
   └─ esbuild（後端）→ dist/index.js
4. 部署 dist/public/ 為靜態文件
5. 啟動 node dist/index.js（後端伺服器）
```

## 驗證部署成功

部署完成後，訪問以下 URL 驗證：

1. **首頁**：`https://your-domain.vercel.app/`
   - 應顯示「歐堡商務汽車旅館 (Production-v2.1)」
   - 右上角應顯示「v2.0-Verified」標記

2. **Health Check**：`https://your-domain.vercel.app/api/status`
   - 應返回 JSON：`{ "env": "production", "db": "check_pending", "version": "Production-v2.1" }`

3. **登入頁面**：`https://your-domain.vercel.app/login`
   - 應能使用 admin / 123456 登入

## 常見問題排查

### 問題 1：404 Not Found
- **原因**：Root Directory 設為 `client` 導致後端 API 無法訪問
- **解決**：Root Directory 改為 `None`（根目錄）

### 問題 2：No Output Directory named "public" found
- **原因**：vercel.json 的 outputDirectory 配置錯誤
- **解決**：確保 vercel.json 中 `outputDirectory: "dist/public"`

### 問題 3：資料庫連接失敗
- **原因**：DATABASE_URL 未設置或格式錯誤
- **解決**：在 Vercel Settings 中設置正確的 DATABASE_URL

### 問題 4：後端 API 返回 404
- **原因**：後端未正確編譯或啟動
- **解決**：檢查 Vercel Logs，查看 `node dist/index.js` 是否成功啟動

## 日誌檢查

在 Vercel Dashboard → Deployments → 選擇最新部署 → Logs

查看以下日誌行：
- **Build 日誌**：`npm run build` 的輸出
- **Runtime 日誌**：`node dist/index.js` 的輸出
- **API 日誌**：後端 API 請求的日誌

## 強制重新部署

如果修改代碼後 Vercel 未自動部署：
1. 在 Vercel Dashboard 中找到該專案
2. 點擊「Redeploy」或「Clear Build Cache」
3. 等待部署完成

## 聯繫支持

如有問題，請檢查：
1. Vercel Logs 中的錯誤信息
2. 確認所有環境變數已正確設置
3. 確認 Root Directory 設為根目錄（None）
