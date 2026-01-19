import { eq, and, or, gte, lte, desc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
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

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      let dbUrl = process.env.DATABASE_URL;
      // 添加 TiDB SSL 配置（如果還沒有）
      if (dbUrl && !dbUrl.includes('ssl')) {
        const separator = dbUrl.includes('?') ? '&' : '?';
        dbUrl = dbUrl + separator + 'ssl=true';
      }
      _db = drizzle(dbUrl);
      console.log('[Database] Connected successfully with SSL');
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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

    const result = await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
    
    // 如果是新插入，返回 insertId；如果是更新，查詢並返回用戶 ID
    if (result[0].insertId) {
      return Number(result[0].insertId);
    }
    
    // 如果是更新，根據 username 或 openId 查詢用戶 ID
    let userId: number | null = null;
    if (user.username) {
      const existingUser = await getUserByUsername(user.username);
      userId = existingUser?.id ?? null;
    } else if (user.openId) {
      const existingUser = await getUserByOpenId(user.openId);
      userId = existingUser?.id ?? null;
    }
    
    if (!userId) {
      throw new Error("Failed to get user ID after upsert");
    }
    return userId;
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

export async function createUser(data: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(data);
  
  // 獲取新創建的用戶
  const newUser = await db
    .select()
    .from(users)
    .orderBy(desc(users.id))
    .limit(1);
  
  if (newUser.length === 0) {
    throw new Error("Failed to retrieve created user");
  }
  
  return newUser[0].id;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
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

export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
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
  
  try {
    // 動態導入 wsManager 以避免循環依賴
    const { wsManager } = await import("./websocket");
    const result = await db.insert(bookings).values(data);
    
    // Drizzle ORM 返回的是插入的行數，我們需要查詢新插入的記錄
    // 使用最新的訂房記錄
    const newBooking = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.id))
      .limit(1);
    
    if (newBooking.length === 0) {
      throw new Error("Failed to retrieve created booking");
    }
    
    const bookingId = newBooking[0].id;
    
    // 更新每一個預訂日期的 bookedQuantity
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      
      // 生成所有預訂日期
      const currentDate = new Date(checkIn);
      currentDate.setHours(0, 0, 0, 0); // 設置為午夜
      
      while (currentDate < checkOut) {
        const dateForQuery = new Date(currentDate);
        dateForQuery.setHours(0, 0, 0, 0);
        
        // 獲取該日期的 roomAvailability 記錄
        const availabilityRecord = await db
          .select()
          .from(roomAvailability)
          .where(
            and(
              eq(roomAvailability.roomTypeId, data.roomTypeId),
              eq(roomAvailability.date, dateForQuery)
            )
          )
          .limit(1);
        
        if (availabilityRecord.length > 0) {
          // 更新 bookedQuantity
          const currentBooked = availabilityRecord[0].bookedQuantity || 0;
          await db
            .update(roomAvailability)
            .set({ bookedQuantity: currentBooked + 1 })
            .where(
              and(
                eq(roomAvailability.roomTypeId, data.roomTypeId),
                eq(roomAvailability.date, dateForQuery)
              )
            );
        } else {
          // 如果沒有記錄，創建一個新的
          await db.insert(roomAvailability).values({
            roomTypeId: data.roomTypeId,
            date: dateForQuery,
            maxSalesQuantity: 10,
            bookedQuantity: 1,
            isAvailable: true,
          });
        }
        
        // 移動到下一天
        currentDate.setDate(currentDate.getDate() + 1);
        
        // 發送房間可用性變更事件
        if (availabilityRecord.length > 0) {
          const updatedRecord = availabilityRecord[0];
          wsManager.broadcast({
            type: 'room_availability_changed',
            roomTypeId: data.roomTypeId,
            date: dateForQuery.toISOString().split('T')[0],
            bookedQuantity: (updatedRecord.bookedQuantity || 0) + 1,
            maxSalesQuantity: updatedRecord.maxSalesQuantity || 10,
          });
        }
      }
    }
    
    // 發送訂單創建事件
    wsManager.broadcast({
      type: 'booking_created',
      bookingId,
      roomTypeId: data.roomTypeId,
      checkInDate: data.checkInDate?.toISOString().split('T')[0] || '',
      checkOutDate: data.checkOutDate?.toISOString().split('T')[0] || '',
      status: data.status || 'pending',
    });
    
    return bookingId;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
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
export async function updateBookingStatus(id: number, status: "pending" | "confirmed" | "pending_payment" | "paid" | "cash_on_site" | "completed" | "cancelled"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 導入 WebSocket 管理器
  const { wsManager } = await import('./websocket');
  
  // 獲取訂單信息
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  
  if (booking.length === 0) {
    throw new Error("Booking not found");
  }
  
  const oldStatus = booking[0].status;
  
  // 更新訂單狀態
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  
  // 發送 WebSocket 事件
  wsManager.broadcast({
    type: 'booking_status_changed' as const,
    bookingId: id,
    roomTypeId: booking[0].roomTypeId,
    oldStatus,
    newStatus: status,
    checkInDate: booking[0].checkInDate ? new Date(booking[0].checkInDate).toISOString().split('T')[0] : '',
    checkOutDate: booking[0].checkOutDate ? new Date(booking[0].checkOutDate).toISOString().split('T')[0] : '',
  });
  
  // 如果從非取消狀態變為取消狀態，減少 bookedQuantity
  if (oldStatus !== 'cancelled' && status === 'cancelled' && booking[0].checkInDate && booking[0].checkOutDate) {
    const checkIn = new Date(booking[0].checkInDate);
    const checkOut = new Date(booking[0].checkOutDate);
    
    // 生成所有預訂日期
    const currentDate = new Date(checkIn);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate < checkOut) {
      const dateForQuery = new Date(currentDate);
      dateForQuery.setHours(0, 0, 0, 0);
      
      // 獲取該日期的 roomAvailability 記錄
      const availabilityRecord = await db
        .select()
        .from(roomAvailability)
        .where(
          and(
            eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
            eq(roomAvailability.date, dateForQuery)
          )
        )
        .limit(1);
      
      if (availabilityRecord.length > 0) {
        // 減少 bookedQuantity
        const currentBooked = availabilityRecord[0].bookedQuantity || 0;
        await db
          .update(roomAvailability)
          .set({ bookedQuantity: Math.max(0, currentBooked - 1) })
          .where(
            and(
              eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
              eq(roomAvailability.date, dateForQuery)
            )
          );
      }
      
      // 移動到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 發送房間可用性變更事件
    let notifyDate = new Date(checkIn);
    notifyDate.setHours(0, 0, 0, 0);
    
    while (notifyDate < checkOut) {
      const dateStr = notifyDate.toISOString().split('T')[0];
      
      // 獲取更新後的可用性信息
      const updatedAvailability = await db
        .select()
        .from(roomAvailability)
        .where(
          and(
            eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
            eq(roomAvailability.date, currentDate)
          )
        )
        .limit(1);
      
      if (updatedAvailability.length > 0) {
        wsManager.broadcast({
          type: 'room_availability_changed' as const,
          roomTypeId: booking[0].roomTypeId,
          date: dateStr,
          bookedQuantity: updatedAvailability[0].bookedQuantity || 0,
          maxSalesQuantity: updatedAvailability[0].maxSalesQuantity || 0,
        });
      }
      
      notifyDate.setDate(notifyDate.getDate() + 1);
    }
  }
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 導入 WebSocket 管理器
  const { wsManager } = await import('./websocket');
  
  // 獲取訂單信息
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  
  if (booking.length === 0) {
    throw new Error("Booking not found");
  }
  
  if (booking[0].checkInDate && booking[0].checkOutDate) {
    const checkIn = new Date(booking[0].checkInDate);
    const checkOut = new Date(booking[0].checkOutDate);
    
    // 生成所有預訂日期
    const currentDate = new Date(checkIn);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate < checkOut) {
      const dateForQuery = new Date(currentDate);
      dateForQuery.setHours(0, 0, 0, 0);
      
      // 獲取該日期的 roomAvailability 記錄
      const availabilityRecord = await db
        .select()
        .from(roomAvailability)
        .where(
          and(
            eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
            eq(roomAvailability.date, dateForQuery)
          )
        )
        .limit(1);
      
      if (availabilityRecord.length > 0) {
        // 減少 bookedQuantity
        const currentBooked = availabilityRecord[0].bookedQuantity || 0;
        await db
          .update(roomAvailability)
          .set({ bookedQuantity: Math.max(0, currentBooked - 1) })
          .where(
            and(
              eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
              eq(roomAvailability.date, dateForQuery)
            )
          );
      }
      
      // 移動到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // 發送 WebSocket 事件
  if (booking.length > 0) {
    wsManager.broadcast({
      type: 'booking_deleted' as const,
      bookingId: id,
      roomTypeId: booking[0].roomTypeId,
      checkInDate: booking[0].checkInDate ? new Date(booking[0].checkInDate).toISOString().split('T')[0] : '',
      checkOutDate: booking[0].checkOutDate ? new Date(booking[0].checkOutDate).toISOString().split('T')[0] : '',
      status: booking[0].status,
    });
    
    // 發送房間可用性變更事件
    if (booking[0].checkInDate && booking[0].checkOutDate) {
      const checkIn = new Date(booking[0].checkInDate);
      const checkOut = new Date(booking[0].checkOutDate);
      let notifyDate = new Date(checkIn);
      notifyDate.setHours(0, 0, 0, 0);
      
      while (notifyDate < checkOut) {
        const dateStr = notifyDate.toISOString().split('T')[0];
        
        // 獲取更新後的可用性信息
        const updatedAvailability = await db
          .select()
          .from(roomAvailability)
          .where(
            and(
              eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
              eq(roomAvailability.date, notifyDate)
            )
          )
          .limit(1);
        
        if (updatedAvailability.length > 0) {
          wsManager.broadcast({
            type: 'room_availability_changed' as const,
            roomTypeId: booking[0].roomTypeId,
            date: dateStr,
            bookedQuantity: updatedAvailability[0].bookedQuantity || 0,
            maxSalesQuantity: updatedAvailability[0].maxSalesQuantity || 0,
          });
        }
        
        notifyDate.setDate(notifyDate.getDate() + 1);
      }
    }
  }
  
  // 刪除訂單
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

// 房間控制系統 - RoomBlockage 函數
type RoomBlockage = {
  id: number;
  roomTypeId: number;
  startDate: Date;
  endDate: Date;
  reason?: string;
};

export async function createRoomBlockage(
  roomTypeId: number,
  startDate: Date,
  endDate: Date,
  reason: string = '手動關閉'
): Promise<RoomBlockage> {
  // TODO: 実現資料庫存儲
  return {
    id: Math.random(),
    roomTypeId,
    startDate,
    endDate,
    reason
  };
}

export async function getRoomBlockages(roomTypeId: number): Promise<RoomBlockage[]> {
  // TODO: 從資料庫查詢
  return [];
}

export async function isDateBlocked(roomTypeId: number, date: Date): Promise<boolean> {
  // TODO: 棄查是否被關閉
  return false;
}

export async function deleteRoomBlockage(id: number): Promise<boolean> {
  // TODO: 実現資料庫刪除
  return true;
}

export async function getBlockedDatesInRange(
  roomTypeId: number,
  startDate: Date,
  endDate: Date
): Promise<RoomBlockage[]> {
  // TODO: 取得範團內的關閉日期
  return [];
}
