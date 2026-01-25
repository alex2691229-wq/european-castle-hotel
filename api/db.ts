import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

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
let initPromise: Promise<void> | null = null;

/**
 * Get database instance. Ensures singleton pattern.
 */
export function getDB() {
  if (_db) {
    return _db;
  }
  
  // If initialization is in progress, wait for it
  if (initPromise) {
    // This is synchronous, but we need async for proper error handling
    // For now, return null and let the caller handle async initialization
    return null;
  }

  return null;
}

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  if (_db) {
    return;
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('[Database] DATABASE_URL environment variable is not set');
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('[Database] Initializing connection with URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));

    // Parse URL
    const url = new URL(databaseUrl);
    const connectionConfig: any = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    };

    console.log('[Database] Connection config:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      database: connectionConfig.database,
      ssl: connectionConfig.ssl,
    });

    const pool = mysql.createPool(connectionConfig);
    _db = drizzle(pool);

    // Test connection
    try {
      const result = await _db.execute(sql`SELECT 1 as test`);
      console.log('[Database] Connection test successful:', result);
    } catch (testError) {
      console.error('[Database] Connection test failed:', testError instanceof Error ? testError.message : testError);
      throw testError;
    }

  } catch (error) {
    console.error('[Database] Failed to initialize:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('[Database] Stack trace:', error.stack);
    }
    _db = null;
    throw error;
  }
}

/**
 * Ensure database is initialized
 */
export async function ensureDB() {
  if (_db) {
    return _db;
  }

  if (!initPromise) {
    initPromise = initializeDatabase();
  }

  try {
    await initPromise;
  } catch (error) {
    console.error('[Database] Initialization error:', error instanceof Error ? error.message : error);
    // Reset promise so next call can retry
    initPromise = null;
    throw error;
  }

  return _db;
}

// Room Type queries
export async function getAllRoomTypes(): Promise<RoomType[]> {
  const db = await ensureDB();
  if (!db) return [];
  
  try {
    const result = await db.select().from(roomTypes);
    return result as RoomType[];
  } catch (error) {
    console.error('[Database] Failed to fetch room types:', error);
    return [];
  }
}

export async function getRoomTypeById(id: number): Promise<RoomType | null> {
  const db = await ensureDB();
  if (!db) return null;
  
  try {
    const result = await db.select().from(roomTypes).where(sql`${roomTypes.id} = ${id}`);
    return result[0] as RoomType || null;
  } catch (error) {
    console.error('[Database] Failed to fetch room type:', error);
    return null;
  }
}

// User queries
export async function getUserByUsername(username: string) {
  const db = await ensureDB();
  if (!db) return null;
  
  try {
    const result = await db.select().from(users).where(sql`${users.username} = ${username}`);
    return result[0] || null;
  } catch (error) {
    console.error('[Database] Failed to fetch user:', error);
    return null;
  }
}

export async function createUser(data: InsertUser) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.insert(users).values(data);
    return result;
  } catch (error) {
    console.error('[Database] Failed to create user:', error);
    throw error;
  }
}

// News queries
export async function getAllNews(): Promise<News[]> {
  const db = await ensureDB();
  if (!db) return [];
  
  try {
    const result = await db.select().from(news);
    return result as News[];
  } catch (error) {
    console.error('[Database] Failed to fetch news:', error);
    return [];
  }
}

// Facilities queries
export async function getAllFacilities(): Promise<Facility[]> {
  const db = await ensureDB();
  if (!db) return [];
  
  try {
    const result = await db.select().from(facilities);
    return result as Facility[];
  } catch (error) {
    console.error('[Database] Failed to fetch facilities:', error);
    return [];
  }
}

// Bookings queries
export async function getBookingById(id: number): Promise<Booking | null> {
  const db = await ensureDB();
  if (!db) return null;
  
  try {
    const result = await db.select().from(bookings).where(sql`${bookings.id} = ${id}`);
    return result[0] as Booking || null;
  } catch (error) {
    console.error('[Database] Failed to fetch booking:', error);
    return null;
  }
}

export async function createBooking(data: InsertBooking) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.insert(bookings).values(data);
    return result;
  } catch (error) {
    console.error('[Database] Failed to create booking:', error);
    throw error;
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await ensureDB();
  if (!db) return [];
  
  try {
    const result = await db.select().from(bookings);
    return result as Booking[];
  } catch (error) {
    console.error('[Database] Failed to fetch bookings:', error);
    return [];
  }
}

// Initialize database on module load
initPromise = initializeDatabase().catch(error => {
  console.error('[Database] Initialization failed on module load:', error instanceof Error ? error.message : error);
});
