import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import bcrypt from "bcrypt";

describe("Password Login System", () => {
  let testAdminId: number;
  const testUsername = "testadmin";
  const testPassword = "testpass123";
  const testName = "Test Admin";

  beforeAll(async () => {
    // 清理測試帳號（如果存在）
    const existing = await db.getUserByUsername(testUsername);
    if (existing) {
      // 刪除現有帳號（如果有刪除函數）
      console.log(`測試帳號 ${testUsername} 已存在，跳過創建`);
      testAdminId = existing.id;
      return;
    }

    // 創建測試帳號
    const passwordHash = await bcrypt.hash(testPassword, 10);
    testAdminId = await db.createUser({
      username: testUsername,
      passwordHash,
      name: testName,
      role: "admin",
      status: "active",
    });

    console.log(`✓ 測試帳號 #${testAdminId} 已創建`);
  });

  it("應該能夠使用正確的帳號密碼登入", async () => {
    const user = await db.getUserByUsername(testUsername);
    
    expect(user).toBeDefined();
    expect(user?.username).toBe(testUsername);
    expect(user?.role).toBe("admin");
    
    // 驗證密碼
    const passwordMatch = await bcrypt.compare(testPassword, user!.passwordHash!);
    expect(passwordMatch).toBe(true);
    
    console.log(`✓ 帳號 ${testUsername} 密碼驗證成功`);
  });

  it("應該能夠更新最後登入時間", async () => {
    const beforeUpdate = await db.getUserByUsername(testUsername);
    const beforeTime = beforeUpdate?.lastSignedIn;

    // 更新最後登入時間
    await db.updateUserLastSignedIn(testAdminId);

    const afterUpdate = await db.getUserByUsername(testUsername);
    const afterTime = afterUpdate?.lastSignedIn;

    expect(afterTime).toBeDefined();
    expect(afterTime).not.toBe(beforeTime);
    
    console.log(`✓ 最後登入時間已更新`);
  });

  it("應該能夠列出所有管理員帳號", async () => {
    const allUsers = await db.getAllUsers();
    const admins = allUsers.filter(u => u.role === "admin");

    expect(admins.length).toBeGreaterThan(0);
    expect(admins.some(a => a.username === testUsername)).toBe(true);
    
    console.log(`✓ 找到 ${admins.length} 個管理員帳號`);
  });

  it("應該能夠創建新的管理員帳號", async () => {
    const newUsername = `admin_${Date.now()}`;
    const newPassword = "newpass123";
    const newName = "New Admin";

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const newAdminId = await db.createUser({
      username: newUsername,
      passwordHash,
      name: newName,
      role: "admin",
      status: "active",
    });

    expect(newAdminId).toBeGreaterThan(0);

    // 驗證新帳號
    const newUser = await db.getUserByUsername(newUsername);
    expect(newUser).toBeDefined();
    expect(newUser?.username).toBe(newUsername);
    expect(newUser?.name).toBe(newName);
    expect(newUser?.role).toBe("admin");

    console.log(`✓ 新管理員帳號 #${newAdminId} 已創建`);
  });

  it("應該拒絕錯誤的密碼", async () => {
    const user = await db.getUserByUsername(testUsername);
    
    expect(user).toBeDefined();
    
    // 驗證錯誤的密碼
    const wrongPassword = "wrongpassword";
    const passwordMatch = await bcrypt.compare(wrongPassword, user!.passwordHash!);
    expect(passwordMatch).toBe(false);
    
    console.log(`✓ 錯誤的密碼被正確拒絕`);
  });

  it("應該能夠更新管理員帳號", async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();

    // 更新帳號名稱
    const newName = "Updated Admin Name";
    await db.updateUser(testAdminId, {
      name: newName,
    });

    const updatedUser = await db.getUserByUsername(testUsername);
    expect(updatedUser?.name).toBe(newName);

    console.log(`✓ 管理員帳號名稱已更新為 "${newName}"`);
  });
});
