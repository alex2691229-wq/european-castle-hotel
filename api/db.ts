import mysql from 'mysql2/promise';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
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

// Singleton pattern for database connection
let _db: MySql2Database | null = null;
let _initPromise: Promise<MySql2Database> | null = null;
let _initError: Error | null = null;

/**
 * Mask sensitive information in DATABASE_URL for logging
 */
function maskDatabaseUrl(url: string): string {
  try {
    // Replace password with ****
    return url.replace(/:[^:@]*@/, ':****@');
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Initialize database connection with explicit error handling
 */
async function initializeDatabase(): Promise<MySql2Database> {
  // If already initialized, return immediately
  if (_db) {
    console.log('[Database] Using existing connection');
    return _db;
  }

  // If initialization is in progress, wait for it
  if (_initPromise) {
    console.log('[Database] Waiting for ongoing initialization...');
    return _initPromise;
  }

  // If previous initialization failed, throw the error
  if (_initError) {
    console.error('[Database] Previous initialization failed, retrying...');
    _initError = null; // Reset error to allow retry
  }

  // Create initialization promise
  _initPromise = (async () => {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        const error = new Error('[Database] DATABASE_URL environment variable is not set');
        console.error(error.message);
        throw error;
      }

      console.log('[Database] DATABASE_URL detected:', maskDatabaseUrl(databaseUrl));

      // Parse connection parameters
      const connectionConfig: any = {
        uri: databaseUrl,
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: false,
        },
        connectTimeout: 20000, // 20 seconds for Vercel cold start
        enableKeepAlive: true,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
        idleTimeout: 60000,
      };

      console.log('[Database] Creating connection pool with config:', {
        connectTimeout: connectionConfig.connectTimeout,
        ssl: { minVersion: connectionConfig.ssl.minVersion, rejectUnauthorized: connectionConfig.ssl.rejectUnauthorized },
        enableKeepAlive: connectionConfig.enableKeepAlive,
      });

      // Create connection pool
      const pool = mysql.createPool(connectionConfig);
      
      // Create Drizzle instance
      _db = drizzle(pool);

      // Perform forced connection test
      console.log('[Database] Performing forced connection test...');
      try {
        const testResult = await _db.execute(sql`SELECT 1 as test`);
        console.log('[Database] ✓ Connection test PASSED');
        console.log('[Database] Test result:', testResult);
      } catch (testError) {
        const errorMsg = testError instanceof Error ? testError.message : String(testError);
        const errorCode = (testError as any)?.code || 'UNKNOWN';
        const errorDetails = {
          code: errorCode,
          message: errorMsg,
          type: testError instanceof Error ? testError.constructor.name : typeof testError,
        };
        
        console.error('[Database] ✗ Connection test FAILED');
        console.error('[Database] Error details:', JSON.stringify(errorDetails, null, 2));
        
        if (errorCode === 'ETIMEDOUT') {
          console.error('[Database] Timeout error - check TiDB Cloud IP whitelist');
        } else if (errorCode === 'ECONNREFUSED') {
          console.error('[Database] Connection refused - check host and port');
        } else if (errorMsg.includes('SSL')) {
          console.error('[Database] SSL error - check certificate configuration');
        } else if (errorMsg.includes('Access denied')) {
          console.error('[Database] Access denied - check credentials');
        }
        
        throw testError;
      }

      // Query room_types to verify data access
      console.log('[Database] Verifying data access by querying room_types...');
      try {
        const roomsResult = await _db.select().from(roomTypes).limit(1);
        console.log('[Database] ✓ Data access verified - found', roomsResult.length, 'room(s)');
      } catch (dataError) {
        console.error('[Database] ✗ Data access failed:', dataError instanceof Error ? dataError.message : String(dataError));
        throw dataError;
      }

      console.log('[Database] ✓✓✓ Database initialization COMPLETE ✓✓✓');
      return _db;

    } catch (error) {
      _initError = error instanceof Error ? error : new Error(String(error));
      console.error('[Database] ✗✗✗ Database initialization FAILED ✗✗✗');
      console.error('[Database] Error:', _initError.message);
      if (_initError.stack) {
        console.error('[Database] Stack:', _initError.stack);
      }
      _db = null;
      _initPromise = null;
      throw _initError;
    }
  })();

  return _initPromise;
}

/**
 * Get database instance - guarantees a ready connection
 * This is the main entry point for all database operations
 */
export async function getDB(): Promise<MySql2Database> {
  console.log('[Database] getDB() called');
  
  try {
    const db = await initializeDatabase();
    if (!db) {
      throw new Error('[Database] Failed to initialize database - db is null');
    }
    console.log('[Database] getDB() returning ready connection');
    return db;
  } catch (error) {
    console.error('[Database] getDB() failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Alias for getDB() for backward compatibility
 */
export async function ensureDB(): Promise<MySql2Database> {
  return getDB();
}

// Room Type queries
export async function getAllRoomTypes(): Promise<RoomType[]> {
  try {
    const db = await getDB();
    console.log('[Database] Fetching all room types...');
    const result = await db.select().from(roomTypes);
    console.log('[Database] ✓ Fetched', result.length, 'room types');
    return result as RoomType[];
  } catch (error) {
    console.error('[Database] Failed to fetch room types:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function getRoomTypeById(id: number): Promise<RoomType | null> {
  try {
    const db = await getDB();
    const result = await db.select().from(roomTypes).where(sql`${roomTypes.id} = ${id}`);
    return result[0] as RoomType || null;
  } catch (error) {
    console.error('[Database] Failed to fetch room type:', error);
    throw error;
  }
}

// User queries
export async function getUserByUsername(username: string) {
  try {
    const db = await getDB();
    console.log('[Database] Fetching user:', username);
    const result = await db.select().from(users).where(sql`${users.username} = ${username}`);
    console.log('[Database] User query result count:', result.length);
    return result[0] || null;
  } catch (error) {
    console.error('[Database] Failed to fetch user:', username, error);
    throw error;
  }
}

export async function createUser(data: InsertUser) {
  try {
    const db = await getDB();
    const result = await db.insert(users).values(data);
    return result;
  } catch (error) {
    console.error('[Database] Failed to create user:', error);
    throw error;
  }
}

// News queries
export async function getAllNews(): Promise<News[]> {
  try {
    const db = await getDB();
    const result = await db.select().from(news);
    return result as News[];
  } catch (error) {
    console.error('[Database] Failed to fetch news:', error);
    throw error;
  }
}

// Facilities queries
export async function getAllFacilities(): Promise<Facility[]> {
  try {
    const db = await getDB();
    const result = await db.select().from(facilities);
    return result as Facility[];
  } catch (error) {
    console.error('[Database] Failed to fetch facilities:', error);
    throw error;
  }
}

// Bookings queries
export async function getBookingById(id: number): Promise<Booking | null> {
  try {
    const db = await getDB();
    const result = await db.select().from(bookings).where(sql`${bookings.id} = ${id}`);
    return result[0] as Booking || null;
  } catch (error) {
    console.error('[Database] Failed to fetch booking:', error);
    throw error;
  }
}

export async function createBooking(data: InsertBooking) {
  try {
    const db = await getDB();
    const result = await db.insert(bookings).values(data);
    return result;
  } catch (error) {
    console.error('[Database] Failed to create booking:', error);
    throw error;
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const db = await getDB();
    const result = await db.select().from(bookings);
    return result as Booking[];
  } catch (error) {
    console.error('[Database] Failed to fetch bookings:', error);
    throw error;
  }
}

// Room Type creation
export async function createRoomType(data: InsertRoomType) {
  try {
    const db = await getDB();
    console.log('[Database] Creating room type...');
    const result = await db.insert(roomTypes).values(data);
    console.log('[Database] ✓ Room type created successfully');
    return result;
  } catch (error) {
    console.error('[Database] Failed to create room type:', error);
    throw error;
  }
}

// Seed facilities if empty
export async function seedFacilitiesIfEmpty() {
  try {
    const db = await getDB();
    const existing = await db.select().from(facilities);
    if (existing.length > 0) {
      console.log('[Database] Facilities already exist, skipping seed');
      return;
    }
    
    const defaultFacilities: InsertFacility[] = [
      {
        name: '免費 Wi-Fi',
        description: '全館覆蓋高速無線網絡',
        icon: 'wifi',
        images: null,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: '游泳池',
        description: '室內溫水游泳池',
        icon: 'waves',
        images: null,
        displayOrder: 2,
        isActive: true,
      },
      {
        name: '免費停車',
        description: '提供免費停車位',
        icon: 'car',
        images: null,
        displayOrder: 3,
        isActive: true,
      },
      {
        name: '健身房',
        description: '24小時開放健身房',
        icon: 'dumbbell',
        images: null,
        displayOrder: 4,
        isActive: true,
      },
      {
        name: '餐廳',
        description: '提供各式美食',
        icon: 'utensils',
        images: null,
        displayOrder: 5,
        isActive: true,
      },
    ];

    await db.insert(facilities).values(defaultFacilities);
    console.log('[Database] Facilities seeded successfully');
  } catch (error) {
    console.error('[Database] Failed to seed facilities:', error);
  }
}

// Initialize on module load
console.log('[Database] Module loaded, initializing database...');
initializeDatabase().catch(error => {
  console.error('[Database] Module-level initialization failed:', error instanceof Error ? error.message : String(error));
});
