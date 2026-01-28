const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL:', dbUrl ? dbUrl.substring(0, 50) + '...' : 'NOT SET');

// 檢查是否有 SSL 參數
if (dbUrl) {
  const hasSSL = dbUrl.includes('ssl=') || dbUrl.includes('sslMode=');
  console.log('Has SSL params:', hasSSL);
  
  if (!hasSSL) {
    console.log('\n⚠️  DATABASE_URL 缺少 SSL 參數！');
    console.log('需要添加 ?ssl=amazon 或 ?sslMode=REQUIRED');
  }
}
