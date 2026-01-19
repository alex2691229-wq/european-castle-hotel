import { drizzle } from 'drizzle-orm/mysql2';
import { users } from '../drizzle/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 環境變數未設置');
  process.exit(1);
}

let db;
try {
  db = drizzle(DATABASE_URL);
} catch (error) {
  console.error('❌ 數據庫連接失敗:', error);
  process.exit(1);
}

async function initAdmin() {
  try {
    // 檢查是否已有管理員帳號
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('✓ 管理員帳號已存在');
      return;
    }
    
    // 創建默認管理員帳號
    const passwordHash = await bcrypt.hash('123456', 10);
    
    await db.insert(users).values({
      username: 'admin',
      passwordHash,
      name: '管理員',
      role: 'admin',
      loginMethod: 'password',
      status: 'active',
    });
    
    console.log('✓ 已創建默認管理員帳號');
    console.log('  用戶名: admin');
    console.log('  密碼: 123456');
    console.log('  ⚠️  請在首次登入後修改密碼！');
    
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    process.exit(1);
  }
}

initAdmin().then(() => {
  console.log('\n✓ 初始化完成');
  process.exit(0);
});
