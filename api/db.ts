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

let _db: MySql2Database | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Get database instance. Ensures singleton pattern.
 */
export function getDB() {
  if (_db) {
    return _db;
  }
  
  if (initPromise) {
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

    // Create connection pool with explicit SSL configuration
    const connectionConfig: any = {
      uri: databaseUrl,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      connectTimeout: 10000,
      enableKeepAlive: true,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    };

    console.log('[Database] Connection config:', {
      ssl: connectionConfig.ssl,
      connectTimeout: connectionConfig.connectTimeout,
      enableKeepAlive: connectionConfig.enableKeepAlive,
      connectionLimit: connectionConfig.connectionLimit,
    });

    const pool = mysql.createPool(connectionConfig);
    _db = drizzle(pool);

    // Test connection
    try {
      console.log('[Database] Testing connection...');
      const result = await _db.execute(sql`SELECT 1 as test`);
      console.log('[Database] Connection test successful:', result);
    } catch (testError) {
      console.error('[Database] Connection test failed');
      if (testError instanceof Error) {
        console.error('[Database] Error code:', (testError as any).code);
        console.error('[Database] Error message:', testError.message);
        console.error('[Database] Error stack:', testError.stack);
      } else {
        console.error('[Database] Error:', testError);
      }
      throw testError;
    }

  } catch (error) {
    console.error('[Database] Failed to initialize');
    if (error instanceof Error) {
      console.error('[Database] Error code:', (error as any).code);
      console.error('[Database] Error message:', error.message);
      console.error('[Database] Error stack:', error.stack);
    } else {
      console.error('[Database] Error:', error);
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
    console.error('[Database] Initialization error');
    if (error instanceof Error) {
      console.error('[Database] Error code:', (error as any).code);
      console.error('[Database] Error message:', error.message);
    } else {
      console.error('[Database] Error:', error);
    }
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
  if (!db) {
    console.error('[Database] Database not initialized when fetching user:', username);
    return null;
  }
  
  try {
    console.log('[Database] Fetching user:', username);
    const result = await db.select().from(users).where(sql`${users.username} = ${username}`);
    console.log('[Database] User query result count:', result.length);
    if (result[0]) {
      console.log('[Database] User found:', result[0].username, 'role:', result[0].role);
    } else {
      console.log('[Database] No user found for:', username);
    }
    return result[0] || null;
  } catch (error) {
    console.error('[Database] Failed to fetch user:', username, error);
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
  console.error('[Database] Initialization failed on module load');
  if (error instanceof Error) {
    console.error('[Database] Error code:', (error as any).code);
    console.error('[Database] Error message:', error.message);
  }
});


// Room Type creation
export async function createRoomType(data: InsertRoomType) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.insert(roomTypes).values(data);
    console.log('[Database] Room type created successfully');
    return result;
  } catch (error) {
    console.error('[Database] Failed to create room type:', error);
    throw error;
  }
}

// Seed facilities if empty
export async function seedFacilitiesIfEmpty() {
  const db = await ensureDB();
  if (!db) return;
  
  try {
    const existing = await db.select().from(facilities);
    if (existing.length > 0) {
      console.log('[Database] Facilities already exist, skipping seed');
      return;
    }
    
    const defaultFacilities: InsertFacility[] = [
      {
        name: '免費 Wi-Fi',
        nameEn: 'Free Wi-Fi',
        description: '全館覆蓋高速無線網絡',
        descriptionEn: 'High-speed wireless network throughout the hotel',
        icon: 'wifi',
        images: null,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: '游泳池',
        nameEn: 'Swimming Pool',
        description: '室內溫水游泳池',
        descriptionEn: 'Indoor heated swimming pool',
        icon: 'waves',
        images: null,
        displayOrder: 2,
        isActive: true,
      },
      {
        name: '免費停車',
        nameEn: 'Free Parking',
        description: '提供免費停車位',
        descriptionEn: 'Complimentary parking available',
        icon: 'car',
        images: null,
        displayOrder: 3,
        isActive: true,
      },
      {
        name: '健身房',
        nameEn: 'Fitness Center',
        description: '24小時開放健身房',
        descriptionEn: '24-hour fitness center',
        icon: 'dumbbell',
        images: null,
        displayOrder: 4,
        isActive: true,
      },
      {
        name: '餐廳',
        nameEn: 'Restaurant',
        description: '提供各式美食',
        descriptionEn: 'Variety of dining options',
        icon: 'utensils',
        images: null,
        displayOrder: 5,
        isActive: true,
      },
    ];
    
    for (const facility of defaultFacilities) {
      await db.insert(facilities).values(facility);
    }
    
    console.log('[Database] Facilities seeded successfully');
  } catch (error) {
    console.error('[Database] Failed to seed facilities:', error);
  }
}

// Seed news if empty
export async function seedNewsIfEmpty() {
  const db = await ensureDB();
  if (!db) return;
  
  try {
    const existing = await db.select().from(news);
    if (existing.length > 0) {
      console.log('[Database] News already exist, skipping seed');
      return;
    }
    
    const defaultNews: InsertNews[] = [
      {
        title: '春季優惠活動',
        titleEn: 'Spring Promotion',
        content: '本月推出春季優惠方案，住宿享受優惠折扣',
        contentEn: 'Special spring promotion with discounts on room rates',
        type: 'promotion',
        coverImage: null,
        isPublished: true,
        publishDate: new Date(),
      },
      {
        title: '新房型上線',
        titleEn: 'New Room Types Available',
        content: '新增豪華套房，提供更舒適的住宿體驗',
        contentEn: 'New luxury suites now available for booking',
        type: 'announcement',
        coverImage: null,
        isPublished: true,
        publishDate: new Date(),
      },
      {
        title: '暑期活動',
        titleEn: 'Summer Events',
        content: '暑期舉辦各項活動，歡迎參加',
        contentEn: 'Various summer activities and events planned',
        type: 'event',
        coverImage: null,
        isPublished: true,
        publishDate: new Date(),
      },
    ];
    
    for (const item of defaultNews) {
      await db.insert(news).values(item);
    }
    
    console.log('[Database] News seeded successfully');
  } catch (error) {
    console.error('[Database] Failed to seed news:', error);
  }
}


// Count functions for dashboard
export async function getRoomTypeCount(): Promise<number> {
  const db = await ensureDB();
  if (!db) return 0;
  
  try {
    const result = await db.select({ count: sql`COUNT(*)` }).from(roomTypes);
    return result[0]?.count ? Number(result[0].count) : 0;
  } catch (error) {
    console.error('[Database] Failed to count room types:', error);
    return 0;
  }
}

export async function getBookingCount(): Promise<number> {
  const db = await ensureDB();
  if (!db) return 0;
  
  try {
    const result = await db.select({ count: sql`COUNT(*)` }).from(bookings);
    return result[0]?.count ? Number(result[0].count) : 0;
  } catch (error) {
    console.error('[Database] Failed to count bookings:', error);
    return 0;
  }
}

export async function getNewsCount(): Promise<number> {
  const db = await ensureDB();
  if (!db) return 0;
  
  try {
    const result = await db.select({ count: sql`COUNT(*)` }).from(news);
    return result[0]?.count ? Number(result[0].count) : 0;
  } catch (error) {
    console.error('[Database] Failed to count news:', error);
    return 0;
  }
}

export async function getFacilityCount(): Promise<number> {
  const db = await ensureDB();
  if (!db) return 0;
  
  try {
    const result = await db.select({ count: sql`COUNT(*)` }).from(facilities);
    return result[0]?.count ? Number(result[0].count) : 0;
  } catch (error) {
    console.error('[Database] Failed to count facilities:', error);
    return 0;
  }
}

// Seed room types if empty
export async function seedRoomTypesIfEmpty() {
  const db = await ensureDB();
  if (!db) return;
  
  try {
    const existing = await db.select().from(roomTypes);
    if (existing.length > 0) {
      console.log('[Database] Room types already exist, skipping seed');
      return;
    }
    
    const defaultRoomTypes: InsertRoomType[] = [
      {
        name: '豪華套房',
        nameEn: 'Luxury Suite',
        description: '寬敞舒適的豪華套房，配備獨立車庫和高級設施',
        descriptionEn: 'Spacious luxury suite with private garage and premium amenities',
        size: '50坪',
        capacity: 4,
        price: '3500.00',
        weekendPrice: '4500.00',
        maxSalesQuantity: 5,
        images: null,
        amenities: JSON.stringify(['獨立車庫', '豪華衛浴', '高速 Wi-Fi', '液晶電視']),
        isAvailable: true,
        displayOrder: 1,
      },
      {
        name: '商務客房',
        nameEn: 'Business Room',
        description: '設計簡潔的商務客房，適合出差住宿',
        descriptionEn: 'Well-designed business room perfect for business travelers',
        size: '30坪',
        capacity: 2,
        price: '2500.00',
        weekendPrice: '3200.00',
        maxSalesQuantity: 10,
        images: null,
        amenities: JSON.stringify(['獨立車庫', '工作區', '高速 Wi-Fi', '淋浴間']),
        isAvailable: true,
        displayOrder: 2,
      },
      {
        name: '標準客房',
        nameEn: 'Standard Room',
        description: '舒適實惠的標準客房，提供基本設施',
        descriptionEn: 'Comfortable and affordable standard room with basic amenities',
        size: '25坪',
        capacity: 2,
        price: '1800.00',
        weekendPrice: '2300.00',
        maxSalesQuantity: 15,
        images: null,
        amenities: JSON.stringify(['獨立車庫', '基本設施', 'Wi-Fi', '浴室']),
        isAvailable: true,
        displayOrder: 3,
      },
    ];
    
    for (const roomType of defaultRoomTypes) {
      await db.insert(roomTypes).values(roomType);
    }
    
    console.log('[Database] Room types seeded successfully');
  } catch (error) {
    console.error('[Database] Failed to seed room types:', error);
  }
}


// Home Config queries
export async function getHomeConfig(): Promise<HomeConfig | null> {
  const db = await ensureDB();
  if (!db) return null;
  
  try {
    const result = await db.select().from(homeConfig).limit(1);
    return result[0] as HomeConfig || null;
  } catch (error) {
    console.error('[Database] Failed to fetch home config:', error);
    return null;
  }
}

export async function updateHomeConfig(data: Partial<InsertHomeConfig>) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.update(homeConfig).set(data);
    return result;
  } catch (error) {
    console.error('[Database] Failed to update home config:', error);
    throw error;
  }
}

// Room Type operations
export async function deleteRoomType(id: number) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.delete(roomTypes).where(sql`${roomTypes.id} = ${id}`);
    return result;
  } catch (error) {
    console.error('[Database] Failed to delete room type:', error);
    throw error;
  }
}

export async function updateRoomType(id: number, data: Partial<InsertRoomType>) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.update(roomTypes).set(data).where(sql`${roomTypes.id} = ${id}`);
    return result;
  } catch (error) {
    console.error('[Database] Failed to update room type:', error);
    throw error;
  }
}

// News operations
export async function createNews(data: InsertNews) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.insert(news).values(data);
    return result;
  } catch (error) {
    console.error('[Database] Failed to create news:', error);
    throw error;
  }
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.update(news).set(data).where(sql`${news.id} = ${id}`);
    return result;
  } catch (error) {
    console.error('[Database] Failed to update news:', error);
    throw error;
  }
}

export async function deleteNews(id: number) {
  const db = await ensureDB();
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.delete(news).where(sql`${news.id} = ${id}`);
    return result;
  } catch (error) {
    console.error('[Database] Failed to delete news:', error);
    throw error;
  }
}

// Booking queries
export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const db = await ensureDB();
  if (!db) return [];
  
  try {
    const result = await db.select().from(bookings).where(sql`${bookings.guestPhone} = ${phone}`);
    return result as Booking[];
  } catch (error) {
    console.error('[Database] Failed to fetch bookings by phone:', error);
    return [];
  }
}
