# 歐堡商務汽車旅館 - Clean Rebuild TODO

## 🟢 Phase 1：全新重製（Clean Rebuild）- 已完成

- [x] 創建新的 GitHub Branch（clean-start）
- [x] 刪除所有測試文件（*.test.ts）
- [x] 刪除初始化腳本和工作報告
- [x] 重寫 api/db.ts（正確讀取環境變數，包含 SSL 配置）
- [x] 重寫 api/index.ts（只保留首頁房型和健康檢查，移除 @ts-nocheck）
- [x] 添加正確的 TypeScript 型別定義
- [x] 本地編譯成功（無 TypeScript 錯誤）

## 🟢 Phase 2：首頁房型顯示和健康檢查 - 已完成

- [x] 實作 /api/health/db 端點（返回 "connected"）
- [x] 實作 /api/room-types 端點（從資料庫讀取房型）
- [x] 首頁正常顯示
- [x] 本地測試成功

## 🟡 Phase 3：部署到 Vercel - 進行中

- [ ] 推送 clean-start branch 到 GitHub
- [ ] 在 Vercel 中設置 clean-start branch 為部署來源
- [ ] 驗證 Vercel 部署成功
- [ ] 驗證 /api/health/db 返回 "connected"
- [ ] 驗證首頁房型顯示正常

## ⚪ Phase 4：後續功能開發（待驗證部署後開始）

- [ ] 實作登入功能
- [ ] 實作訂房流程
- [ ] 實作管理後台
- [ ] 實作其他功能

---

## 關鍵決定

1. **使用 clean-start branch** - 完全隔離新代碼，避免舊代碼干擾
2. **只讀取環境變數** - 不硬編碼任何敏感信息
3. **包含 SSL 配置** - `{ rejectUnauthorized: false }`
4. **移除所有 @ts-nocheck** - 確保 TypeScript 型別安全
5. **分階實作** - 先驗證基礎功能，再開發後續功能

---

## 環境變數要求

```
DATABASE_URL=mysql://user:password@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl=true
```

---

## 驗證檢查清單

### 本地驗證 ✅
- [x] 首頁正常顯示
- [x] /api/health/db 返回 "connected"
- [x] 編譯成功（無 TypeScript 錯誤）

### Vercel 驗證 ⏳
- [ ] 部署成功
- [ ] /api/health/db 返回 "connected"
- [ ] 首頁房型正常顯示
- [ ] 無 TypeScript 報錯


## 🟢 新功能需求 - 已完成

- [x] 在首頁導航欄添加「最新消息」按鈕
- [x] 創建 /news 頁面顯示最新消息
- [x] 從數據庫讀取消息內容
- [x] 本地測試驗證
- [ ] 推送到 clean-start branch
