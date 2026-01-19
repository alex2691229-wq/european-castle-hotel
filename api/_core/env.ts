// @ts-nocheck
// 獲取 OAuth 伺服器 URL，如果未設定則使用預設值
function getOAuthServerUrl(): string {
  const configured = process.env.OAUTH_SERVER_URL?.trim();
  if (configured) {
    return configured;
  }
  
  // 在 Vercel 環境中使用當前網址
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log(`[ENV] OAUTH_SERVER_URL not configured, using Vercel URL: ${url}`);
    return url;
  }
  
  // 在本地開發環境中使用 localhost
  const localUrl = 'http://localhost:3000';
  console.log(`[ENV] OAUTH_SERVER_URL not configured, using localhost: ${localUrl}`);
  return localUrl;
}

// 診斷環境變數
if (process.env.NODE_ENV === "production") {
  console.log('[ENV] === Production Environment Diagnostics ===');
  console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    const masked = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
    console.log('[ENV] DATABASE_URL (masked):', masked);
  }
  
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  console.log('[ENV] BUILT_IN_FORGE_API_URL exists:', !!forgeUrl);
  console.log('[ENV] BUILT_IN_FORGE_API_KEY exists:', !!forgeKey);
  
  if (!forgeUrl || !forgeKey) {
    console.warn('[ENV] Manus storage credentials missing:');
    console.warn('  - BUILT_IN_FORGE_API_URL:', forgeUrl ? '✓ set' : '✗ missing');
    console.warn('  - BUILT_IN_FORGE_API_KEY:', forgeKey ? '✓ set' : '✗ missing');
  }
  console.log('[ENV] === End Diagnostics ===');
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: getOAuthServerUrl(),
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
