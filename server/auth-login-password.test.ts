import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import bcrypt from "bcrypt";

describe("Password-based login system", () => {
  beforeAll(async () => {
    // 確保默認管理員帳號存在
    const existingAdmin = await db.getUserByUsername("admin");
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("admin123456", 10);
      await db.upsertUser({
        username: "admin",
        passwordHash,
        name: "管理員",
        role: "admin",
        loginMethod: "password",
      });
    }
  });

  it("應該能查詢管理員帳號", async () => {
    const user = await db.getUserByUsername("admin");
    expect(user).toBeDefined();
    expect(user?.username).toBe("admin");
    expect(user?.role).toBe("admin");
    expect(user?.passwordHash).toBeDefined();
  });

  it("應該能驗證正確的密碼", async () => {
    const user = await db.getUserByUsername("admin");
    expect(user).toBeDefined();
    
    if (user && user.passwordHash) {
      const passwordMatch = await bcrypt.compare("admin123456", user.passwordHash);
      expect(passwordMatch).toBe(true);
    }
  });

  it("應該能驗證錯誤的密碼", async () => {
    const user = await db.getUserByUsername("admin");
    expect(user).toBeDefined();
    
    if (user && user.passwordHash) {
      const passwordMatch = await bcrypt.compare("wrongpassword", user.passwordHash);
      expect(passwordMatch).toBe(false);
    }
  });

  it("應該能創建新的管理員帳號", async () => {
    const passwordHash = await bcrypt.hash("testpass123", 10);
    await db.upsertUser({
      username: "testadmin",
      passwordHash,
      name: "測試管理員",
      role: "admin",
      loginMethod: "password",
    });

    const user = await db.getUserByUsername("testadmin");
    expect(user).toBeDefined();
    expect(user?.username).toBe("testadmin");
    expect(user?.name).toBe("測試管理員");
    expect(user?.role).toBe("admin");
  });

  it("應該能更新管理員帳號的密碼", async () => {
    const user = await db.getUserByUsername("testadmin");
    expect(user).toBeDefined();

    if (user) {
      const newPasswordHash = await bcrypt.hash("newpass123", 10);
      await db.updateUser(user.id, { passwordHash: newPasswordHash });

      const updatedUser = await db.getUserByUsername("testadmin");
      expect(updatedUser).toBeDefined();

      if (updatedUser && updatedUser.passwordHash) {
        const passwordMatch = await bcrypt.compare("newpass123", updatedUser.passwordHash);
        expect(passwordMatch).toBe(true);
      }
    }
  });

  it("應該能更新最後登入時間", async () => {
    const user = await db.getUserByUsername("admin");
    expect(user).toBeDefined();

    if (user) {
      const beforeUpdate = user.lastSignedIn;
      
      // 等待一點時間確保時間戳不同
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await db.updateUserLastSignedIn(user.id);

      const updatedUser = await db.getUserByUsername("admin");
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.lastSignedIn.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    }
  });

  it("應該能刪除管理員帳號", async () => {
    const user = await db.getUserByUsername("testadmin");
    expect(user).toBeDefined();

    if (user) {
      await db.deleteUser(user.id);

      const deletedUser = await db.getUserByUsername("testadmin");
      expect(deletedUser).toBeUndefined();
    }
  });

  it("應該能列出所有用戶", async () => {
    const allUsers = await db.getAllUsers();
    expect(Array.isArray(allUsers)).toBe(true);
    expect(allUsers.length).toBeGreaterThan(0);
    
    const adminUsers = allUsers.filter(u => u.role === "admin");
    expect(adminUsers.length).toBeGreaterThan(0);
  });
});
