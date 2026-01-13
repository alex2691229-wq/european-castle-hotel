import { eq, and, or, gte, lte, desc, sql } from "drizzle-orm";
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

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  // Support both openId (OAuth) and username (password) authentication
  if (!user.openId && !user.username) {
    throw new Error("Either openId or username is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
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
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(users).orderBy(desc(users.createdAt));

  return result;
}

export async function updateUser(id: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, id));
}

// Room Types queries
export async function getAllRoomTypes(): Promise<RoomType[]> {
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
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(roomTypes).values(data);
  return Number(result[0].insertId);
}

export async function updateRoomType(id: number, data: Partial<InsertRoomType>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
}

export async function deleteRoomType(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(roomTypes).where(eq(roomTypes.id, id));
}

// Bookings queries
export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(data);
  return Number(result[0].insertId);
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  
  return result[0];
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt));
  
  return result;
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.guestPhone, phone))
    .orderBy(desc(bookings.createdAt));
  
  return result;
}

export async function getBookingsByRoomAndDateRange(
  roomTypeId: number,
  startDate: Date,
  endDate: Date
): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const result = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.roomTypeId, roomTypeId),
        or(
          // 訂單的入住日期在範圍內
          and(
            sql`${bookings.checkInDate} >= ${startTime}`,
            sql`${bookings.checkInDate} <= ${endTime}`
          ),
          // 訂單的退房日期在範圍內
          and(
            sql`${bookings.checkOutDate} >= ${startTime}`,
            sql`${bookings.checkOutDate} <= ${endTime}`
          ),
          // 訂單跨越整個範圍
          and(
            sql`${bookings.checkInDate} <= ${startTime}`,
            sql`${bookings.checkOutDate} >= ${endTime}`
          )
        )
      )
    );
  
  return result;
}

export async function updateBookingStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bookings).where(eq(bookings.id, id));
}

export async function checkRoomAvailability(roomTypeId: number, checkIn: Date, checkOut: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Check if there are any overlapping bookings
  const overlappingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.roomTypeId, roomTypeId),
        eq(bookings.status, "confirmed"),
        // Check for date overlap
        gte(bookings.checkOutDate, checkIn),
        lte(bookings.checkInDate, checkOut)
      )
    );
  
  return overlappingBookings.length === 0;
}

// News queries
export async function getAllNews(): Promise<News[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(news)
    .where(eq(news.isPublished, true))
    .orderBy(desc(news.publishDate));
  
  return result;
}

export async function getNewsById(id: number): Promise<News | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(news)
    .where(eq(news.id, id))
    .limit(1);
  
  return result[0];
}

export async function createNews(data: InsertNews): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(news).values(data);
  return Number(result[0].insertId);
}

export async function updateNews(id: number, data: Partial<InsertNews>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(news).set({ isPublished: false }).where(eq(news.id, id));
}

// Facilities queries
export async function getAllFacilities(): Promise<Facility[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(facilities)
    .where(eq(facilities.isActive, true))
    .orderBy(facilities.displayOrder);
  
  return result;
}

export async function getFacilityById(id: number): Promise<Facility | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(facilities)
    .where(eq(facilities.id, id));
  
  return result[0] || null;
}

export async function createFacility(data: InsertFacility): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(facilities).values(data);
  return Number(result[0].insertId);
}

export async function updateFacility(id: number, data: Partial<InsertFacility>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(facilities).set(data).where(eq(facilities.id, id));
}

// Contact Messages queries
export async function createContactMessage(data: InsertContactMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contactMessages).values(data);
  return Number(result[0].insertId);
}

export async function getAllContactMessages(): Promise<ContactMessage[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  
  return result;
}

export async function markMessageAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
}

// Room Availability queries
export async function getRoomAvailabilityByDateRange(
  roomTypeId: number,
  startDate: Date,
  endDate: Date
): Promise<RoomAvailability[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, startDate),
        lte(roomAvailability.date, endDate)
      )
    )
    .orderBy(roomAvailability.date);
  
  return result;
}

export async function setRoomAvailability(
  roomTypeId: number,
  dates: Date[],
  isAvailable: boolean,
  reason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const date of dates) {
    const existing = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, date)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(roomAvailability)
        .set({ isAvailable, reason, updatedAt: new Date() })
        .where(
          and(
            eq(roomAvailability.roomTypeId, roomTypeId),
            eq(roomAvailability.date, date)
          )
        );
    } else {
      await db.insert(roomAvailability).values({
        roomTypeId,
        date,
        isAvailable,
        reason,
        maxSalesQuantity: 10,
        bookedQuantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

export async function getRoomAvailability(
  roomTypeId: number,
  date: Date
): Promise<RoomAvailability | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, date)
      )
    )
    .limit(1);

  return result[0];
}

export async function updateRoomAvailability(
  roomTypeId: number,
  date: Date,
  data: Partial<InsertRoomAvailability>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(roomAvailability)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, date)
      )
    );
}

export async function batchUpdateRoomAvailability(
  roomTypeId: number,
  dates: Date[],
  data: Partial<InsertRoomAvailability>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const date of dates) {
    await db
      .update(roomAvailability)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, date)
        )
      );
  }
}

// Home Config queries
export async function getHomeConfig(): Promise<HomeConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(homeConfig).limit(1);
  return result[0];
}

export async function updateHomeConfig(data: Partial<InsertHomeConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getHomeConfig();
  if (existing) {
    await db.update(homeConfig).set(data).where(eq(homeConfig.id, existing.id));
  } else {
    await db.insert(homeConfig).values(data as InsertHomeConfig);
  }
}

// Featured Services queries
export async function getAllFeaturedServices(): Promise<FeaturedService[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(featuredServices)
    .where(eq(featuredServices.isActive, true))
    .orderBy(featuredServices.displayOrder);

  return result;
}

export async function getFeaturedServiceById(id: number): Promise<FeaturedService | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(featuredServices)
    .where(eq(featuredServices.id, id))
    .limit(1);

  return result[0];
}

export async function createFeaturedService(data: InsertFeaturedService): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(featuredServices).values(data);
  return Number(result[0].insertId);
}

export async function updateFeaturedService(id: number, data: Partial<InsertFeaturedService>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(featuredServices).set(data).where(eq(featuredServices.id, id));
}

export async function deleteFeaturedService(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(featuredServices).where(eq(featuredServices.id, id));
}


export async function updateMaxSalesQuantity(
  roomTypeId: number,
  date: Date,
  maxSalesQuantity: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(roomAvailability)
    .set({ maxSalesQuantity, updatedAt: new Date() })
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, date)
      )
    );
}

export async function updateDynamicPrice(
  roomTypeId: number,
  date: Date,
  weekdayPrice?: number,
  weekendPrice?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { updatedAt: new Date() };
  
  if (weekdayPrice !== undefined) {
    updateData.price = weekdayPrice;
  }
  if (weekendPrice !== undefined) {
    updateData.weekendPrice = weekendPrice;
  }

  await db
    .update(roomAvailability)
    .set(updateData)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, date)
      )
    );
}


export async function getUnavailableDates(roomTypeId: number): Promise<RoomAvailability[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.isAvailable, false)
      )
    )
    .orderBy(roomAvailability.date);

  return result;
}

export async function updateBookedQuantity(
  roomTypeId: number,
  date: Date,
  bookedQuantity: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(roomAvailability)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, date)
      )
    );
}


export async function checkMaxSalesQuantity(
  roomTypeId: number,
  checkInDate: Date,
  checkOutDate: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Get all availability records for the date range
  const availabilityRecords = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, checkInDate),
        lte(roomAvailability.date, checkOutDate)
      )
    );

  // Check if all dates have available quantity
  for (const record of availabilityRecords) {
    if (record.maxSalesQuantity <= 0) {
      return false;
    }
  }

  return true;
}
