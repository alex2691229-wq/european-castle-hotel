import { URL } from 'url';

const localUrl = process.env.DATABASE_URL;

console.log('\n=== DATABASE_URL 主機名比較 ===\n');

if (localUrl) {
  const parsed = new URL(localUrl);
  console.log('本地 DATABASE_URL 主機名:', parsed.hostname);
  console.log('本地 DATABASE_URL 端口:', parsed.port);
  console.log('本地 DATABASE_URL 用戶名:', parsed.username);
  
  // 提取 TiDB 實例 ID
  const instanceId = parsed.hostname.split('.')[0];
  console.log('TiDB 實例 ID:', instanceId);
} else {
  console.log('DATABASE_URL 未設置');
}

console.log('\n⚠️  請比較 Vercel Dashboard 中的 DATABASE_URL：');
console.log('Settings → Environment Variables → DATABASE_URL');
console.log('確認主機名是否與本地相同。');
