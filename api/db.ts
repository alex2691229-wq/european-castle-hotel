import { eq, and, or, gte, lte, desc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import { 
  InsertUser, 
  users, 
  roomTypes, 
  RoomType, 
  InsertRoomType,
  bookings,
  Booking,
  InsertBooking,
  news,
  News,
  InsertNews,
  facilities,
  Facility,
  InsertFacility,
  contactMessages,
  ContactMessage,
  InsertContactMessage,
  roomAvailability,
  RoomAvailability,
  InsertRoomAvailability,
  homeConfig,
  HomeConfig,
  InsertHomeConfig,
  featuredServices,
  FeaturedService,
  InsertFeaturedService
} from '../drizzle/schema.js';
import { ENV } from './_core/env.js';

let _db: ReturnType<typeof drizzle> | null = null;
let _dbInitialized = false;
let initPromise: Promise<void> | null = null;

export async function getDb() {
  if (_dbInitialized && _db) {
    return _db;
  }

  if (initPromise) {
    await initPromise;
    if (!_db) {
      throw new Error('Database initialization failed');
    }
    return _db;
  }

  initPromise = initializeDatabase();
  await initPromise;
  
  if (!_db) {
    throw new Error('Database initialization failed');
  }
  
  _dbInitialized = true;
  return _db;
}

async function initializeDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('[Database] Raw DATABASE_URL:', dbUrl.replace(/:[^:]*@/, ':***@'));
    
    // Check for mysql:// prefix
    if (!dbUrl.startsWith('mysql://')) {
      throw new Error('DATABASE_URL must start with mysql://');
    }
    
    // Check for duplicate mysql:// prefix
    const mysqlMatches = dbUrl.match(/mysql:\/\//g) || [];
    if (mysqlMatches.length > 1) {
      console.error('[Database] ERROR: Duplicate mysql:// prefix detected!');
      console.error('[Database] Found', mysqlMatches.length, 'occurrences of mysql://');
      throw new Error('Duplicate mysql:// prefix in DATABASE_URL');
    }

    console.log('[Database] Connecting to:', dbUrl.replace(/:[^:]*@/, ':***@'));

    // Parse URL
    const url = new URL(dbUrl);
    
    console.log('[Database] Parsed URL components:');
    console.log('[Database]   Protocol:', url.protocol);
    console.log('[Database]   Hostname:', url.hostname);
    console.log('[Database]   Port:', url.port || '3306');
    console.log('[Database]   Username:', url.username);
    console.log('[Database]   Database:', url.pathname.slice(1));
    
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    console.log('[Database] Connection config:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      database: connectionConfig.database,
      ssl: 'enabled',
    });

    const pool = mysql.createPool(connectionConfig);
    _db = drizzle(pool) as ReturnType<typeof drizzle>;
    _dbInitialized = true;

    // Test connection
    try {
      const result = await _db.execute(sql`SELECT 1 as test`);
      console.log('[Database] Connection test successful');
    } catch (testError) {
      console.warn('[Database] Connection test warning:', testError);
    }

  } catch (error) {
    console.error('[Database] Failed to initialize:', error instanceof Error ? error.message : error);
    _db = null;
    throw error;
  }
}

// Room Types queries
export async function getAllRoomTypes(): Promise<RoomType[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(roomTypes)
    .orderBy(roomTypes.displayOrder);
  
  return result;
}

export async function getAvailableRoomTypes(): Promise<RoomType[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.isAvailable, true))
    .orderBy(roomTypes.displayOrder);
  
  return result;
}

export async function getRoomTypeById(id: number): Promise<RoomType | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.id, id))
    .limit(1);
  
  return result[0];
}

export async function createRoomType(data: InsertRoomType): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(roomTypes).values(data);
  return Number(result[0].insertId);
}

export async function updateRoomType(id: number, data: Partial<InsertRoomType>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
}

export async function deleteRoomType(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(roomTypes).where(eq(roomTypes.id, id));
}

// Users queries
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function createUser(data: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(users).values(data);
  return Number(result[0].insertId);
}

export async function updateUser(id: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(users).where(eq(users.id, id));
}

// Bookings queries
export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(bookings).values(data);
  return Number(result[0].insertId);
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  return result;
}

export async function updateBooking(id: number, data: Partial<InsertBooking>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(bookings).where(eq(bookings.id, id));
}
