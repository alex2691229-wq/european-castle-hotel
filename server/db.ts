// @ts-nocheck
import { eq, sql } from "drizzle-orm";
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

let _db: any = null;
const RETRY_DELAY = 1000; 
const MAX_RETRIES = 3;

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
    if (retries > 0 && (error?.code === 'PROTOCOL_CONNECTION_LOST' || error?.code === 'ER_CON_COUNT_ERROR')) {
      console.warn(`[Database] Connection issue, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * 取得資料庫連線實例 (確保所有函數內部都呼叫此函數)
 */
export async function getDb() {
  if (_db) return _db;
  
  if (!process.env.DATABASE_URL) {
    console.error('[Database] DATABASE_URL not set');
    return null;
  }
  
  try {
    const mysql = await import('mysql2/promise');
    const url = new URL(process.env.DATABASE_URL);
    
    const config = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      connectTimeout: 10000,
      enableKeepAlive: true,
      waitForConnections: true,
      connectionLimit: 1, 
      maxIdle: 1,
      idleTimeout: 60000,
    };
    
    const pool = mysql.createPool(config);
    _db = drizzle(pool, { mode: 'default' });
    return _db;
  } catch (error: any) {
    console.error('[Database] Failed to connect:', error?.message || error);
    _db = null;
    return null;
  }
}

// --- 使用者管理函數 (修復登入與權限) ---

export async function upsertUser(user: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: InsertUser = { ...user };
  const { id, ...updateSet } = values;

  const result = await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });

  return result.insertId as number;
}

export async function getUserByUsername(username: string): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function updateUser(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUserLastSignedIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

// --- 房型管理函數 ---

export async function getAllRoomTypes(): Promise<RoomType[]> {
  const db = await getDb();
  if (!db) return [];
  return await retryWithBackoff(async () => await db.select().from(roomTypes));
}

export async function getRoomTypeById(id: number): Promise<RoomType | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(roomTypes).where(eq(roomTypes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createRoomType(data: InsertRoomType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(roomTypes).values(data);
  return result.insertId as number;
}

export async function updateRoomType(id: number, data: Partial<InsertRoomType>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
}

export async function deleteRoomType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(roomTypes).where(eq(roomTypes.id, id));
}

// --- 訂單管理函數 ---

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookings);
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(data);
  return result.insertId as number;
}

// --- 精選服務 (Featured Services) ---

export async function getAllFeaturedServices(): Promise<FeaturedService[]> {
  const db = await getDb(); // ✅ 修正：呼叫 getDb()
  if (!db) return [];
  return await db.select().from(featuredServices).orderBy(featuredServices.displayOrder);
}

export async function getFeaturedServiceById(id: number): Promise<FeaturedService | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(featuredServices).where(eq(featuredServices.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createFeaturedService(data: InsertFeaturedService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(featuredServices).values(data);
  return await getFeaturedServiceById(result.insertId as number);
}

export async function updateFeaturedService(id: number, data: Partial<InsertFeaturedService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(featuredServices).set(data).where(eq(featuredServices.id, id));
}

export async function deleteFeaturedService(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(featuredServices).where(eq(featuredServices.id, id));
}

// --- 設施與消息管理 ---

export async function getAllFacilities(): Promise<Facility[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(facilities).orderBy(facilities.displayOrder);
}

export async function getAllNews(): Promise<News[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(news);
}

export async function getHomeConfig(): Promise<HomeConfig | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(homeConfig).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateHomeConfig(data: Partial<InsertHomeConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getHomeConfig();
  if (existing) {
    await db.update(homeConfig).set(data).where(eq(homeConfig.id, existing.id));
  } else {
    await db.insert(homeConfig).values(data as InsertHomeConfig);
  }
}