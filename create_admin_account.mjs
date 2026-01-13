import bcrypt from 'bcryptjs';
import { db } from './server/db.js';

async function createAdminAccount() {
  const username = 'jason';
  const password = '88888888';
  const name = 'Jason';
  const role = 'admin';

  // 檢查用戶名是否已存在
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, username),
  });

  if (existingUser) {
    console.log(`用戶名 "${username}" 已存在！`);
    console.log(`用戶資訊: ID=${existingUser.id}, 名稱=${existingUser.name}, 角色=${existingUser.role}`);
    
    // 更新密碼
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ 
      passwordHash,
      updatedAt: new Date()
    }).where(eq(users.username, username));
    
    console.log('✅ 密碼已更新！');
  } else {
    // 創建新用戶
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      username,
      passwordHash,
      name,
      role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ 管理員帳號創建成功！');
    console.log(`用戶資訊: ID=${newUser.id}, 用戶名=${newUser.username}, 名稱=${newUser.name}, 角色=${newUser.role}`);
  }
  
  process.exit(0);
}

createAdminAccount().catch(err => {
  console.error('❌ 創建帳號失敗:', err);
  process.exit(1);
});
