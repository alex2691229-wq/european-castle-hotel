import { eq, and, gte, lte, desc } from "drizzle-orm";
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

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

export async function updateBookingStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
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
  
  // For each date, insert or update the availability record
  for (const date of dates) {
    // Normalize date to midnight UTC
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    
    // Check if record exists
    const existing = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, normalizedDate)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing record
      await db
        .update(roomAvailability)
        .set({ isAvailable, reason, updatedAt: new Date() })
        .where(eq(roomAvailability.id, existing[0].id));
    } else {
      // Insert new record
      await db.insert(roomAvailability).values({
        roomTypeId,
        date: normalizedDate,
        isAvailable,
        reason,
      });
    }
  }
}

export async function getUnavailableDates(
  roomTypeId: number,
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get dates marked as unavailable by admin
  const unavailableRecords = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.isAvailable, false),
        gte(roomAvailability.date, startDate),
        lte(roomAvailability.date, endDate)
      )
    );
  
  // Get dates with confirmed bookings
  const bookedDates = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.roomTypeId, roomTypeId),
        eq(bookings.status, "confirmed"),
        gte(bookings.checkInDate, startDate),
        lte(bookings.checkInDate, endDate)
      )
    );
  
  // Combine both sets of dates
  const allUnavailableDates = new Set<string>();
  
  unavailableRecords.forEach(record => {
    allUnavailableDates.add(record.date.toISOString().split('T')[0]);
  });
  
  bookedDates.forEach(booking => {
    // Add all dates between check-in and check-out
    const current = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    
    while (current < end) {
      allUnavailableDates.add(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  });
  
  return Array.from(allUnavailableDates).map(dateStr => new Date(dateStr));
}

// Home Config queries
export async function getHomeConfig(): Promise<HomeConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(homeConfig)
    .limit(1);
  
  return result[0];
}

export async function updateHomeConfig(data: Partial<InsertHomeConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get existing config
  const existing = await getHomeConfig();
  
  if (existing) {
    // Update existing
    await db.update(homeConfig).set(data).where(eq(homeConfig.id, existing.id));
  } else {
    // Create new
    await db.insert(homeConfig).values(data as InsertHomeConfig);
  }
}


// Featured Services Management
export async function getAllFeaturedServices(): Promise<FeaturedService[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db
      .select()
      .from(featuredServices)
      .where(eq(featuredServices.isActive, true))
      .orderBy(featuredServices.displayOrder);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get featured services:", error);
    return [];
  }
}

export async function getFeaturedServiceById(id: number): Promise<FeaturedService | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db
      .select()
      .from(featuredServices)
      .where(eq(featuredServices.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get featured service:", error);
    return null;
  }
}

export async function createFeaturedService(data: InsertFeaturedService): Promise<FeaturedService | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(featuredServices).values(data);
    const id = (result as any).insertId;
    return getFeaturedServiceById(id);
  } catch (error) {
    console.error("[Database] Failed to create featured service:", error);
    return null;
  }
}

export async function updateFeaturedService(id: number, data: Partial<InsertFeaturedService>): Promise<FeaturedService | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db
      .update(featuredServices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(featuredServices.id, id));
    return getFeaturedServiceById(id);
  } catch (error) {
    console.error("[Database] Failed to update featured service:", error);
    return null;
  }
}

export async function deleteFeaturedService(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db
      .delete(featuredServices)
      .where(eq(featuredServices.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete featured service:", error);
    return false;
  }
}


export async function updateMaxSalesQuantity(
  roomTypeId: number,
  date: Date,
  maxSalesQuantity: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Normalize date to midnight UTC
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);
  
  // Check if record exists
  const existing = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, normalizedDate)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing record
    await db
      .update(roomAvailability)
      .set({ maxSalesQuantity, updatedAt: new Date() })
      .where(eq(roomAvailability.id, existing[0].id));
  } else {
    // Insert new record with the max sales quantity
    await db.insert(roomAvailability).values({
      roomTypeId,
      date: normalizedDate,
      maxSalesQuantity,
      isAvailable: true,
    });
  }
}

export async function checkMaxSalesQuantity(
  roomTypeId: number,
  checkInDate: Date,
  checkOutDate: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get all dates between check-in and check-out
  const dates: Date[] = [];
  const current = new Date(checkInDate);
  while (current < checkOutDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Check each date
  for (const date of dates) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    
    const record = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, normalizedDate)
        )
      )
      .limit(1);
    
    if (record.length > 0) {
      const maxQty = record[0].maxSalesQuantity || 10;
      const bookedQty = record[0].bookedQuantity || 0;
      
      // If booked quantity reaches max, cannot book
      if (bookedQty >= maxQty) {
        return false;
      }
    }
  }
  
  return true;
}

export async function updateBookedQuantity(
  roomTypeId: number,
  checkInDate: Date,
  checkOutDate: Date,
  increment: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all dates between check-in and check-out
  const dates: Date[] = [];
  const current = new Date(checkInDate);
  while (current < checkOutDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Update booked quantity for each date
  for (const date of dates) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    
    const record = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, normalizedDate)
        )
      )
      .limit(1);
    
    if (record.length > 0) {
      const currentBooked = record[0].bookedQuantity || 0;
      await db
        .update(roomAvailability)
        .set({ 
          bookedQuantity: currentBooked + increment,
          updatedAt: new Date() 
        })
        .where(eq(roomAvailability.id, record[0].id));
    } else {
      // Create new record if it doesn't exist
      await db.insert(roomAvailability).values({
        roomTypeId,
        date: normalizedDate,
        bookedQuantity: increment,
        maxSalesQuantity: 10,
        isAvailable: true,
      });
    }
  }
}
