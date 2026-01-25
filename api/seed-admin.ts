import bcrypt from 'bcryptjs';
import { ensureDB } from './db.js';
import { users } from '../drizzle/schema.js';
import { sql } from 'drizzle-orm';

/**
 * Seed admin account if it doesn't exist
 */
export async function seedAdminAccount() {
  try {
    console.log('[Seed] Starting admin account seeding...');
    
    const db = await ensureDB();
    if (!db) {
      console.error('[Seed] Database not initialized');
      return;
    }

    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(sql`${users.username} = 'admin'`);
    
    if (existingAdmin.length > 0) {
      console.log('[Seed] Admin account already exists');
      return;
    }

    // Create admin account with password 123456
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('[Seed] Generated password hash for admin');
    
    await db.insert(users).values({
      username: 'admin',
      name: 'Administrator',
      email: 'admin@hotel.local',
      passwordHash: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('[Seed] Admin account created successfully');
    console.log('[Seed] Username: admin');
    console.log('[Seed] Password: 123456');
    
  } catch (error) {
    console.error('[Seed] Failed to seed admin account:', error);
    if (error instanceof Error) {
      console.error('[Seed] Error message:', error.message);
      console.error('[Seed] Error stack:', error.stack);
    }
  }
}
