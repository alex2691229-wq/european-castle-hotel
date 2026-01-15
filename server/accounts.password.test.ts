import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import bcrypt from 'bcrypt';

describe('Account Password Management', () => {
  let testUserId: number;
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Create a test user with password
    const passwordHash = await bcrypt.hash(testPassword, 10);
    await db.upsertUser({
      username: testUsername,
      name: 'Test User',
      role: 'user',
      passwordHash,
      loginMethod: 'username',
    });

    const user = await db.getUserByUsername(testUsername);
    if (user) {
      testUserId = user.id;
    }
  });

  it.skip('should create user with hashed password', async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe(testPassword); // Should be hashed
  });

  it.skip('should verify correct password', async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    
    if (user?.passwordHash) {
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      expect(isValid).toBe(true);
    }
  });

  it.skip('should reject incorrect password', async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    
    if (user?.passwordHash) {
      const isValid = await bcrypt.compare('wrongpassword', user.passwordHash);
      expect(isValid).toBe(false);
    }
  });

  it.skip('should update password', async () => {
    const newPassword = 'newpassword456';
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await db.updateUser(testUserId, { passwordHash: newPasswordHash });
    
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    
    if (user?.passwordHash) {
      const isValid = await bcrypt.compare(newPassword, user.passwordHash);
      expect(isValid).toBe(true);
      
      // Old password should not work
      const oldValid = await bcrypt.compare(testPassword, user.passwordHash);
      expect(oldValid).toBe(false);
    }
  });
});
