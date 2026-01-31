import { drizzle } from "drizzle-orm/mysql2";
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
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;
let _connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * 重試邏輯：在連線失敗時自動重試
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error?.code === 'PROTOCOL_CONNECTION_LOST') {
      console.warn(`[Database] Connection lost, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

export async function getDb() {
  if (_db) return _db;
  
  if (!process.env.DATABASE_URL) {
    console.error('[Database] DATABASE_URL not set');
    return null;
  }
  
  try {
    const mysql = await import('mysql2/promise');
    
    // 解析 DATABASE_URL 以提取連接參數
    // 格式: mysql://user:password@host:port/database?ssl=true
    const url = new URL(process.env.DATABASE_URL);
    
    const config = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // 移除前導斜杠
      // SSL 配置：TiDB Cloud 要求 SSL 認證
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true, // 必須啟用 SSL 認證
      },
      // 連線超時配置
      connectTimeout: 10000, // 增加超時等待，避免冷啟動失敗
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // 連線池配置：Serverless 環境應限制連線數
      waitForConnections: true,
      connectionLimit: 1, // Serverless 環境建議限制為 1
      maxIdle: 1,
      idleTimeout: 60000,
      queueLimit: 0,
    };
    
    console.log(`[Database] Connecting to: ${config.host}:${config.port}/${config.database}`);
    const pool = mysql.createPool(config);
    
    // 測試連線
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1');
    connection.release();
    
    _db = drizzle(pool);
    _connectionRetries = 0; // 重置重試計數
    console.log('[Database] Connected successfully with SSL enabled');
    console.log('[Database] SELECT 1 test passed!');
  } catch (error: any) {
    console.error('[Database] Failed to connect:', error?.message || error);
    if (error?.code) console.error('[Database] Error code:', error.code);
    _db = null;
    _connectionRetries++;
  }
  
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<number> {
  // Support both openId (OAuth) and username (password) authentication
  if (!user.openId && !user.username) {
    throw new Error("Either openId or username is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    throw new Error("Database not available");
  }

  try {
    const values: InsertUser = {};
    const updateSet: Record<string, unknown> = {};

    // Set unique identifier
    if (user.openId) {
      values.openId = user.openId;
    }
    if (user.username) {
      values.username = user.username;
    }

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Handle password hash for username/password auth
    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash;
      updateSet.passwordHash = user.passwordHash;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    // Upsert: insert or update
    const result = await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });

    return result.insertId as number;
  } catch (error) {
    console.error("[Database] Error in upsertUser:", error);
    throw error;
  }
}

export async function getUserByUsername(username: string): Promise<InsertUser | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Error in getUserByUsername:", error);
    return null;
  }
}

export async function getAllRoomTypes(): Promise<RoomType[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get room types: database not available");
    return [];
  }

  try {
    return await retryWithBackoff(async () => {
      const result = await db.select().from(roomTypes);
      return result;
    });
  } catch (error) {
    console.error("[Database] Failed to fetch room types:", error);
    return [];
  }
}

export async function getRoomTypeById(id: number): Promise<RoomType | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get room type: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Error in getRoomTypeById:", error);
    return null;
  }
}

export async function createRoomType(data: InsertRoomType): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create room type: database not available");
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(roomTypes).values(data);
    return result.insertId as number;
  } catch (error) {
    console.error("[Database] Error in createRoomType:", error);
    throw error;
  }
}

export async function updateRoomType(id: number, data: Partial<InsertRoomType>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update room type: database not available");
    throw new Error("Database not available");
  }

  try {
    await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
  } catch (error) {
    console.error("[Database] Error in updateRoomType:", error);
    throw error;
  }
}

export async function deleteRoomType(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete room type: database not available");
    throw new Error("Database not available");
  }

  try {
    await db.delete(roomTypes).where(eq(roomTypes.id, id));
  } catch (error) {
    console.error("[Database] Error in deleteRoomType:", error);
    throw error;
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bookings: database not available");
    return [];
  }

  try {
    return await db.select().from(bookings);
  } catch (error) {
    console.error("[Database] Failed to fetch bookings:", error);
    return [];
  }
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get booking: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Error in getBookingById:", error);
    return null;
  }
}

export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create booking: database not available");
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(bookings).values(data);
    return result.insertId as number;
  } catch (error) {
    console.error("[Database] Error in createBooking:", error);
    throw error;
  }
}

export async function updateBooking(id: number, data: Partial<InsertBooking>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update booking: database not available");
    throw new Error("Database not available");
  }

  try {
    await db.update(bookings).set(data).where(eq(bookings.id, id));
  } catch (error) {
    console.error("[Database] Error in updateBooking:", error);
    throw error;
  }
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete booking: database not available");
    throw new Error("Database not available");
  }

  try {
    await db.delete(bookings).where(eq(bookings.id, id));
  } catch (error) {
    console.error("[Database] Error in deleteBooking:", error);
    throw error;
  }
}

export async function getAllNews(): Promise<News[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get news: database not available");
    return [];
  }

  try {
    return await db.select().from(news);
  } catch (error) {
    console.error("[Database] Failed to fetch news:", error);
    return [];
  }
}

export async function createNews(data: InsertNews): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create news: database not available");
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(news).values(data);
    return result.insertId as number;
  } catch (error) {
    console.error("[Database] Error in createNews:", error);
    throw error;
  }
}

export async function getHomeConfig(): Promise<HomeConfig | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get home config: database not available");
    return null;
  }

  try {
    const result = await db.select().from(homeConfig).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to fetch home config:", error);
    return null;
  }
}

export async function updateHomeConfig(data: Partial<InsertHomeConfig>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update home config: database not available");
    throw new Error("Database not available");
  }

  try {
    const existing = await getHomeConfig();
    if (existing) {
      await db.update(homeConfig).set(data).where(eq(homeConfig.id, existing.id));
    } else {
      await db.insert(homeConfig).values(data as InsertHomeConfig);
    }
  } catch (error) {
    console.error("[Database] Error in updateHomeConfig:", error);
    throw error;
  }
}

// Import eq for where clauses
import { eq } from "drizzle-orm";
