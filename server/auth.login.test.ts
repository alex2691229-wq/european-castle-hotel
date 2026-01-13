import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import bcrypt from 'bcrypt';

describe('auth.login API', () => {
  beforeAll(async () => {
    // Create a test user with username and password
    const passwordHash = await bcrypt.hash('testpassword123', 10);
    await db.upsertUser({
      username: 'testuser',
      name: 'Test User',
      role: 'user',
      loginMethod: 'username',
      passwordHash,
      status: 'active',
      lastSignedIn: new Date(),
    });
  });

  it('should successfully retrieve user by username', async () => {
    const user = await db.getUserByUsername('testuser');
    expect(user).toBeDefined();
    expect(user?.username).toBe('testuser');
    expect(user?.name).toBe('Test User');
    expect(user?.role).toBe('user');
    expect(user?.status).toBe('active');
    expect(user?.passwordHash).toBeDefined();
  });

  it('should verify password correctly', async () => {
    const user = await db.getUserByUsername('testuser');
    expect(user).toBeDefined();
    
    if (user && user.passwordHash) {
      const isValid = await bcrypt.compare('testpassword123', user.passwordHash);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongpassword', user.passwordHash);
      expect(isInvalid).toBe(false);
    }
  });

  it('should return undefined for non-existent username', async () => {
    const user = await db.getUserByUsername('nonexistentuser');
    expect(user).toBeUndefined();
  });

  it('should check user status correctly', async () => {
    const user = await db.getUserByUsername('testuser');
    expect(user).toBeDefined();
    expect(user?.status).toBe('active');
  });
});
