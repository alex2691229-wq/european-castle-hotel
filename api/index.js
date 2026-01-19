var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  wsManager: () => wsManager
});
import { WebSocketServer, WebSocket } from "ws";
var WebSocketManager, wsManager;
var init_websocket = __esm({
  "server/websocket.ts"() {
    "use strict";
    WebSocketManager = class {
      wss = null;
      clients = /* @__PURE__ */ new Set();
      /**
       * 初始化 WebSocket 伺服器
       */
      initialize(server) {
        this.wss = new WebSocketServer({ server, path: "/ws" });
        this.wss.on("connection", (ws) => {
          console.log("[WebSocket] \u65B0\u5BA2\u6236\u7AEF\u9023\u63A5");
          this.clients.add(ws);
          ws.send(JSON.stringify({
            type: "connected",
            message: "WebSocket \u9023\u63A5\u6210\u529F",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }));
          ws.on("message", (data) => {
            try {
              const message = JSON.parse(data);
              console.log("[WebSocket] \u6536\u5230\u5BA2\u6236\u7AEF\u6D88\u606F:", message);
              if (message.type === "subscribe") {
                ws.send(JSON.stringify({
                  type: "subscribed",
                  channel: message.channel,
                  timestamp: (/* @__PURE__ */ new Date()).toISOString()
                }));
              }
            } catch (error) {
              console.error("[WebSocket] \u89E3\u6790\u6D88\u606F\u5931\u6557:", error);
            }
          });
          ws.on("close", () => {
            console.log("[WebSocket] \u5BA2\u6236\u7AEF\u65B7\u958B\u9023\u63A5");
            this.clients.delete(ws);
          });
          ws.on("error", (error) => {
            console.error("[WebSocket] \u5BA2\u6236\u7AEF\u932F\u8AA4:", error);
            this.clients.delete(ws);
          });
        });
        console.log("[WebSocket] \u4F3A\u670D\u5668\u5DF2\u521D\u59CB\u5316");
      }
      /**
       * 廣播事件給所有客戶端
       */
      broadcast(event) {
        const message = JSON.stringify({
          ...event,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        console.log("[WebSocket] \u5EE3\u64AD\u4E8B\u4EF6:", event.type);
        this.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
      /**
       * 發送事件給特定客戶端
       */
      sendToClient(client, event) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            ...event,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }));
        }
      }
      /**
       * 獲取連接的客戶端數量
       */
      getClientCount() {
        return this.clients.size;
      }
      /**
       * 關閉 WebSocket 伺服器
       */
      close() {
        if (this.wss) {
          this.wss.close();
          this.clients.clear();
          console.log("[WebSocket] \u4F3A\u670D\u5668\u5DF2\u95DC\u9589");
        }
      }
    };
    wsManager = new WebSocketManager();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;

// server/db.ts
import { eq, and, or, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  // Optional for backward compatibility
  username: varchar("username", { length: 64 }).unique(),
  // Optional for username/password auth
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("oauth"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var roomTypes = mysqlTable("room_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("descriptionEn"),
  size: varchar("size", { length: 50 }),
  // e.g., "30坪"
  capacity: int("capacity").notNull().default(2),
  // number of guests
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weekendPrice: decimal("weekendPrice", { precision: 10, scale: 2 }),
  maxSalesQuantity: int("maxSalesQuantity").default(10).notNull(),
  // maximum number of rooms that can be sold per day
  images: text("images"),
  // JSON array of image URLs
  amenities: text("amenities"),
  // JSON array of amenities
  isAvailable: boolean("isAvailable").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  roomTypeId: int("roomTypeId").notNull(),
  userId: int("userId"),
  guestName: varchar("guestName", { length: 100 }).notNull(),
  guestEmail: varchar("guestEmail", { length: 320 }),
  guestPhone: varchar("guestPhone", { length: 20 }).notNull(),
  checkInDate: timestamp("checkInDate").notNull(),
  checkOutDate: timestamp("checkOutDate").notNull(),
  numberOfGuests: int("numberOfGuests").notNull().default(2),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  specialRequests: text("specialRequests"),
  status: mysqlEnum("status", ["pending", "confirmed", "pending_payment", "paid", "cash_on_site", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  titleEn: varchar("titleEn", { length: 200 }),
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  type: mysqlEnum("type", ["announcement", "promotion", "event"]).default("announcement").notNull(),
  coverImage: varchar("coverImage", { length: 500 }),
  isPublished: boolean("isPublished").default(true).notNull(),
  publishDate: timestamp("publishDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("descriptionEn"),
  icon: varchar("icon", { length: 50 }),
  // lucide icon name
  images: text("images"),
  // JSON array of image URLs
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var roomAvailability = mysqlTable("room_availability", {
  id: int("id").autoincrement().primaryKey(),
  roomTypeId: int("roomTypeId").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  maxSalesQuantity: int("maxSalesQuantity").default(10).notNull(),
  // maximum number of rooms that can be sold on this date
  bookedQuantity: int("bookedQuantity").default(0).notNull(),
  // number of rooms already booked
  weekdayPrice: decimal("weekdayPrice", { precision: 10, scale: 2 }),
  // override price for this date (weekday)
  weekendPrice: decimal("weekendPrice", { precision: 10, scale: 2 }),
  // override price for this date (weekend)
  isHolidayOverride: boolean("isHolidayOverride"),
  // null = auto-detect, true = force holiday, false = force weekday
  reason: varchar("reason", { length: 200 }),
  // optional reason for unavailability
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var homeConfig = mysqlTable("home_config", {
  id: int("id").autoincrement().primaryKey(),
  carouselImages: text("carouselImages"),
  // JSON array of carousel image URLs
  vipGarageImage: varchar("vipGarageImage", { length: 500 }),
  deluxeRoomImage: varchar("deluxeRoomImage", { length: 500 }),
  facilitiesImage: varchar("facilitiesImage", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var featuredServices = mysqlTable("featured_services", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  titleEn: varchar("titleEn", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("descriptionEn"),
  image: varchar("image", { length: 500 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var paymentDetails = mysqlTable("payment_details", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "credit_card", "ecpay", "cash_on_site"]).default("bank_transfer").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "received", "failed", "refunded"]).default("pending").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("TWD").notNull(),
  // Bank transfer specific fields
  bankName: varchar("bankName", { length: 100 }),
  bankCode: varchar("bankCode", { length: 10 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  accountName: varchar("accountName", { length: 100 }),
  transferReference: varchar("transferReference", { length: 100 }),
  // transfer memo/reference number
  transferDate: timestamp("transferDate"),
  // when the transfer was made
  lastFiveDigits: varchar("lastFiveDigits", { length: 5 }),
  // last 5 digits of transfer for verification
  // Payment confirmation
  confirmedAt: timestamp("confirmedAt"),
  // when payment was confirmed
  confirmedBy: int("confirmedBy"),
  // admin user who confirmed the payment
  notes: text("notes"),
  // additional notes about the payment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      let dbUrl = process.env.DATABASE_URL;
      if (dbUrl && !dbUrl.includes("ssl")) {
        const separator = dbUrl.includes("?") ? "&" : "?";
        dbUrl = dbUrl + separator + "ssl=true";
      }
      _db = drizzle(dbUrl);
      console.log("[Database] Connected successfully with SSL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId && !user.username) {
    throw new Error("Either openId or username is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    throw new Error("Database not available");
  }
  try {
    const values = {};
    const updateSet = {};
    if (user.openId) {
      values.openId = user.openId;
    }
    if (user.username) {
      values.username = user.username;
    }
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.passwordHash !== void 0) {
      values.passwordHash = user.passwordHash;
      updateSet.passwordHash = user.passwordHash;
    }
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    const result = await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
    if (result[0].insertId) {
      return Number(result[0].insertId);
    }
    let userId = null;
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
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByUsername(username) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  return result;
}
async function updateUser(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
}
async function deleteUser(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}
async function updateUserLastSignedIn(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
async function getAllRoomTypes() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(roomTypes).orderBy(roomTypes.displayOrder);
  return result;
}
async function getAvailableRoomTypes() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(roomTypes).where(eq(roomTypes.isAvailable, true)).orderBy(roomTypes.displayOrder);
  return result;
}
async function getRoomTypeById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(roomTypes).where(eq(roomTypes.id, id)).limit(1);
  return result[0];
}
async function createRoomType(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(roomTypes).values(data);
  return Number(result[0].insertId);
}
async function updateRoomType(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
}
async function deleteRoomType(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(roomTypes).where(eq(roomTypes.id, id));
}
async function createBooking(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const { wsManager: wsManager2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
    const result = await db.insert(bookings).values(data);
    const newBooking = await db.select().from(bookings).orderBy(desc(bookings.id)).limit(1);
    if (newBooking.length === 0) {
      throw new Error("Failed to retrieve created booking");
    }
    const bookingId = newBooking[0].id;
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      const currentDate = new Date(checkIn);
      currentDate.setHours(0, 0, 0, 0);
      while (currentDate < checkOut) {
        const dateForQuery = new Date(currentDate);
        dateForQuery.setHours(0, 0, 0, 0);
        const availabilityRecord = await db.select().from(roomAvailability).where(
          and(
            eq(roomAvailability.roomTypeId, data.roomTypeId),
            eq(roomAvailability.date, dateForQuery)
          )
        ).limit(1);
        if (availabilityRecord.length > 0) {
          const currentBooked = availabilityRecord[0].bookedQuantity || 0;
          await db.update(roomAvailability).set({ bookedQuantity: currentBooked + 1 }).where(
            and(
              eq(roomAvailability.roomTypeId, data.roomTypeId),
              eq(roomAvailability.date, dateForQuery)
            )
          );
        } else {
          await db.insert(roomAvailability).values({
            roomTypeId: data.roomTypeId,
            date: dateForQuery,
            maxSalesQuantity: 10,
            bookedQuantity: 1,
            isAvailable: true
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
        if (availabilityRecord.length > 0) {
          const updatedRecord = availabilityRecord[0];
          wsManager2.broadcast({
            type: "room_availability_changed",
            roomTypeId: data.roomTypeId,
            date: dateForQuery.toISOString().split("T")[0],
            bookedQuantity: (updatedRecord.bookedQuantity || 0) + 1,
            maxSalesQuantity: updatedRecord.maxSalesQuantity || 10
          });
        }
      }
    }
    wsManager2.broadcast({
      type: "booking_created",
      bookingId,
      roomTypeId: data.roomTypeId,
      checkInDate: data.checkInDate?.toISOString().split("T")[0] || "",
      checkOutDate: data.checkOutDate?.toISOString().split("T")[0] || "",
      status: data.status || "pending"
    });
    return bookingId;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}
async function getBookingById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}
async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  return result;
}
async function getBookingsByPhone(phone) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(bookings).where(eq(bookings.guestPhone, phone)).orderBy(desc(bookings.createdAt));
  return result;
}
async function getBookingsByRoomAndDateRange(roomTypeId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const result = await db.select().from(bookings).where(
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
async function updateBookingStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { wsManager: wsManager2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
  const booking = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (booking.length === 0) {
    throw new Error("Booking not found");
  }
  const oldStatus = booking[0].status;
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  wsManager2.broadcast({
    type: "booking_status_changed",
    bookingId: id,
    roomTypeId: booking[0].roomTypeId,
    oldStatus,
    newStatus: status,
    checkInDate: booking[0].checkInDate ? new Date(booking[0].checkInDate).toISOString().split("T")[0] : "",
    checkOutDate: booking[0].checkOutDate ? new Date(booking[0].checkOutDate).toISOString().split("T")[0] : ""
  });
  if (oldStatus !== "cancelled" && status === "cancelled" && booking[0].checkInDate && booking[0].checkOutDate) {
    const checkIn = new Date(booking[0].checkInDate);
    const checkOut = new Date(booking[0].checkOutDate);
    const currentDate = new Date(checkIn);
    currentDate.setHours(0, 0, 0, 0);
    while (currentDate < checkOut) {
      const dateForQuery = new Date(currentDate);
      dateForQuery.setHours(0, 0, 0, 0);
      const availabilityRecord = await db.select().from(roomAvailability).where(
        and(
          eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
          eq(roomAvailability.date, dateForQuery)
        )
      ).limit(1);
      if (availabilityRecord.length > 0) {
        const currentBooked = availabilityRecord[0].bookedQuantity || 0;
        await db.update(roomAvailability).set({ bookedQuantity: Math.max(0, currentBooked - 1) }).where(
          and(
            eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
            eq(roomAvailability.date, dateForQuery)
          )
        );
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    let notifyDate = new Date(checkIn);
    notifyDate.setHours(0, 0, 0, 0);
    while (notifyDate < checkOut) {
      const dateStr = notifyDate.toISOString().split("T")[0];
      const updatedAvailability = await db.select().from(roomAvailability).where(
        and(
          eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
          eq(roomAvailability.date, currentDate)
        )
      ).limit(1);
      if (updatedAvailability.length > 0) {
        wsManager2.broadcast({
          type: "room_availability_changed",
          roomTypeId: booking[0].roomTypeId,
          date: dateStr,
          bookedQuantity: updatedAvailability[0].bookedQuantity || 0,
          maxSalesQuantity: updatedAvailability[0].maxSalesQuantity || 0
        });
      }
      notifyDate.setDate(notifyDate.getDate() + 1);
    }
  }
}
async function deleteBooking(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { wsManager: wsManager2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
  const booking = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (booking.length === 0) {
    throw new Error("Booking not found");
  }
  if (booking[0].checkInDate && booking[0].checkOutDate) {
    const checkIn = new Date(booking[0].checkInDate);
    const checkOut = new Date(booking[0].checkOutDate);
    const currentDate = new Date(checkIn);
    currentDate.setHours(0, 0, 0, 0);
    while (currentDate < checkOut) {
      const dateForQuery = new Date(currentDate);
      dateForQuery.setHours(0, 0, 0, 0);
      const availabilityRecord = await db.select().from(roomAvailability).where(
        and(
          eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
          eq(roomAvailability.date, dateForQuery)
        )
      ).limit(1);
      if (availabilityRecord.length > 0) {
        const currentBooked = availabilityRecord[0].bookedQuantity || 0;
        await db.update(roomAvailability).set({ bookedQuantity: Math.max(0, currentBooked - 1) }).where(
          and(
            eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
            eq(roomAvailability.date, dateForQuery)
          )
        );
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  if (booking.length > 0) {
    wsManager2.broadcast({
      type: "booking_deleted",
      bookingId: id,
      roomTypeId: booking[0].roomTypeId,
      checkInDate: booking[0].checkInDate ? new Date(booking[0].checkInDate).toISOString().split("T")[0] : "",
      checkOutDate: booking[0].checkOutDate ? new Date(booking[0].checkOutDate).toISOString().split("T")[0] : "",
      status: booking[0].status
    });
    if (booking[0].checkInDate && booking[0].checkOutDate) {
      const checkIn = new Date(booking[0].checkInDate);
      const checkOut = new Date(booking[0].checkOutDate);
      let notifyDate = new Date(checkIn);
      notifyDate.setHours(0, 0, 0, 0);
      while (notifyDate < checkOut) {
        const dateStr = notifyDate.toISOString().split("T")[0];
        const updatedAvailability = await db.select().from(roomAvailability).where(
          and(
            eq(roomAvailability.roomTypeId, booking[0].roomTypeId),
            eq(roomAvailability.date, notifyDate)
          )
        ).limit(1);
        if (updatedAvailability.length > 0) {
          wsManager2.broadcast({
            type: "room_availability_changed",
            roomTypeId: booking[0].roomTypeId,
            date: dateStr,
            bookedQuantity: updatedAvailability[0].bookedQuantity || 0,
            maxSalesQuantity: updatedAvailability[0].maxSalesQuantity || 0
          });
        }
        notifyDate.setDate(notifyDate.getDate() + 1);
      }
    }
  }
  await db.delete(bookings).where(eq(bookings.id, id));
}
async function checkRoomAvailability(roomTypeId, checkIn, checkOut) {
  const db = await getDb();
  if (!db) return false;
  const overlappingBookings = await db.select().from(bookings).where(
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
async function getAllNews() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(news).where(eq(news.isPublished, true)).orderBy(desc(news.publishDate));
  return result;
}
async function getNewsById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result[0];
}
async function createNews(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(news).values(data);
  return Number(result[0].insertId);
}
async function updateNews(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(news).set(data).where(eq(news.id, id));
}
async function deleteNews(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(news).set({ isPublished: false }).where(eq(news.id, id));
}
async function getAllFacilities() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(facilities).where(eq(facilities.isActive, true)).orderBy(facilities.displayOrder);
  return result;
}
async function createFacility(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(facilities).values(data);
  return Number(result[0].insertId);
}
async function updateFacility(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(facilities).set(data).where(eq(facilities.id, id));
}
async function createContactMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactMessages).values(data);
  return Number(result[0].insertId);
}
async function getAllContactMessages() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  return result;
}
async function markMessageAsRead(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
}
async function getRoomAvailabilityByDateRange(roomTypeId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(roomAvailability).where(
    and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      gte(roomAvailability.date, startDate),
      lte(roomAvailability.date, endDate)
    )
  ).orderBy(roomAvailability.date);
  return result;
}
async function setRoomAvailability(roomTypeId, dates, isAvailable, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const date of dates) {
    const existing = await db.select().from(roomAvailability).where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, date)
      )
    ).limit(1);
    if (existing.length > 0) {
      await db.update(roomAvailability).set({ isAvailable, reason, updatedAt: /* @__PURE__ */ new Date() }).where(
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
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
  }
}
async function getHomeConfig() {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(homeConfig).limit(1);
  return result[0];
}
async function updateHomeConfig(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getHomeConfig();
  if (existing) {
    await db.update(homeConfig).set(data).where(eq(homeConfig.id, existing.id));
  } else {
    await db.insert(homeConfig).values(data);
  }
}
async function getAllFeaturedServices() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(featuredServices).where(eq(featuredServices.isActive, true)).orderBy(featuredServices.displayOrder);
  return result;
}
async function getFeaturedServiceById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(featuredServices).where(eq(featuredServices.id, id)).limit(1);
  return result[0];
}
async function createFeaturedService(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(featuredServices).values(data);
  return Number(result[0].insertId);
}
async function updateFeaturedService(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(featuredServices).set(data).where(eq(featuredServices.id, id));
}
async function deleteFeaturedService(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(featuredServices).where(eq(featuredServices.id, id));
}
async function updateMaxSalesQuantity(roomTypeId, date, maxSalesQuantity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(roomAvailability).set({ maxSalesQuantity, updatedAt: /* @__PURE__ */ new Date() }).where(
    and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      eq(roomAvailability.date, date)
    )
  );
}
async function updateDynamicPrice(roomTypeId, date, weekdayPrice, weekendPrice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (weekdayPrice !== void 0) {
    updateData.price = weekdayPrice;
  }
  if (weekendPrice !== void 0) {
    updateData.weekendPrice = weekendPrice;
  }
  await db.update(roomAvailability).set(updateData).where(
    and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      eq(roomAvailability.date, date)
    )
  );
}
async function getUnavailableDates(roomTypeId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(roomAvailability).where(
    and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      eq(roomAvailability.isAvailable, false)
    )
  ).orderBy(roomAvailability.date);
  return result;
}
async function checkMaxSalesQuantity(roomTypeId, checkInDate, checkOutDate) {
  const db = await getDb();
  if (!db) return false;
  const availabilityRecords = await db.select().from(roomAvailability).where(
    and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      gte(roomAvailability.date, checkInDate),
      lte(roomAvailability.date, checkOutDate)
    )
  );
  for (const record of availabilityRecords) {
    if (record.maxSalesQuantity <= 0) {
      return false;
    }
  }
  return true;
}
async function createRoomBlockage(roomTypeId, startDate, endDate, reason = "\u624B\u52D5\u95DC\u9589") {
  return {
    id: Math.random(),
    roomTypeId,
    startDate,
    endDate,
    reason
  };
}
async function isDateBlocked(roomTypeId, date) {
  return false;
}
async function deleteRoomBlockage(id) {
  return true;
}
async function getBlockedDatesInRange(roomTypeId, startDate, endDate) {
  return [];
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name, id, username } = payload;
      if (isNonEmptyString(openId) && isNonEmptyString(appId) && isNonEmptyString(name)) {
        return {
          openId,
          appId,
          name
        };
      } else if (isNonEmptyString(id) && isNonEmptyString(username) && isNonEmptyString(name)) {
        return {
          openId: String(id),
          appId: username,
          name
        };
      } else {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const mockUser = { id: "admin", name: "\u7BA1\u7406\u54E1", email: "admin@example.com", role: "admin" };
  return next({
    ctx: {
      ...ctx,
      user: mockUser
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const mockUser = { id: "admin", name: "\u7BA1\u7406\u54E1", email: "admin@example.com", role: "admin" };
    return next({
      ctx: {
        ...ctx,
        user: mockUser
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError6 } from "@trpc/server";

// server/_core/email.ts
import nodemailer from "nodemailer";
var LINE_ID = "@castle6359577";
var LINE_ADD_FRIEND_URL = "https://line.me/R/ti/p/@castle6359577";
var createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.error("SMTP \u914D\u7F6E\u4E0D\u5B8C\u6574\uFF0C\u90F5\u4EF6\u529F\u80FD\u5C07\u4E0D\u53EF\u7528");
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};
async function sendEmail(to, subject, html, text2) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error("\u90F5\u4EF6\u50B3\u8F38\u914D\u7F6E\u5931\u6557");
      return false;
    }
    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text2 || html.replace(/<[^>]*>/g, "")
    });
    console.log(`\u2705 \u90F5\u4EF6\u5DF2\u767C\u9001\u5230 ${to}\uFF0CMessage ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`\u274C \u90F5\u4EF6\u767C\u9001\u5931\u6557: ${error}`);
    return false;
  }
}
var lineAddFriendBlock = `
  <div style="background: linear-gradient(135deg, #06C755 0%, #05a847 100%); padding: 25px; text-align: center; margin: 25px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(6, 199, 85, 0.3);">
    <div style="margin-bottom: 15px;">
      <span style="font-size: 32px;">\u{1F4AC}</span>
    </div>
    <p style="margin: 0 0 15px 0; color: white; font-size: 16px; font-weight: 500;">
      \u52A0\u5165\u5B98\u65B9 LINE \u597D\u53CB\uFF0C\u7372\u5F97\u5373\u6642\u670D\u52D9
    </p>
    <a href="${LINE_ADD_FRIEND_URL}" 
       style="display: inline-block; background: white; color: #06C755; padding: 14px 40px; 
              border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
      \u2795 \u52A0\u5165\u597D\u53CB
    </a>
    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
      LINE ID: <strong>${LINE_ID}</strong>
    </p>
  </div>
`;
var emailFooter = `
  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
    <div style="margin-bottom: 20px;">
      <a href="${LINE_ADD_FRIEND_URL}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #06C755; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 20px; font-weight: bold;">L</span>
        </div>
      </a>
      <a href="https://www.facebook.com/castlehoteltainan" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #1877F2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 20px; font-weight: bold;">f</span>
        </div>
      </a>
      <a href="tel:06-635-9577" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #8B7355; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 18px;">\u{1F4DE}</span>
        </div>
      </a>
    </div>
    <p style="margin: 0 0 8px 0; color: #495057; font-size: 15px; font-weight: 600;">
      \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928
    </p>
    <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 13px;">
      \u{1F4CD} \u53F0\u5357\u5E02\u65B0\u71DF\u5340\u9577\u69AE\u8DEF\u4E00\u6BB541\u865F
    </p>
    <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 13px;">
      \u{1F4DE} 06-635-9577 \uFF5C \u2709\uFE0F castle6359577@gmail.com
    </p>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #adb5bd; font-size: 11px;">
        \xA9 2026 \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8 All Rights Reserved.
      </p>
    </div>
  </div>
`;
function generateBookingConfirmationEmail(guestName, roomName, checkInDate, checkOutDate, numberOfGuests, totalPrice, bookingId, specialRequests, baseUrl = "https://j4lgdbyk5e-tcqganzzma-uk.a.run.app") {
  const checkInFormatted = checkInDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const checkOutFormatted = checkOutDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1e3 * 60 * 60 * 24));
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #8B7355 0%, #6d5a43 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <span style="font-size: 36px;">\u{1F3F0}</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">\u8A02\u623F\u7533\u8ACB\u5DF2\u6536\u5230</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928</p>
        <div style="display: inline-block; background: #4CAF50; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; margin-top: 15px;">
          \u2713 \u5B98\u65B9\u7DB2\u7AD9\u8A02\u623F
        </div>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          \u89AA\u611B\u7684 <strong style="color: #8B7355;">${guestName}</strong> \u60A8\u597D\uFF01
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u611F\u8B1D\u60A8\u9078\u64C7\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\uFF01\u6211\u5011\u5DF2\u6536\u5230\u60A8\u7684\u8A02\u623F\u7533\u8ACB\uFF0C\u4EE5\u4E0B\u662F\u60A8\u7684\u8A02\u623F\u8A73\u60C5\uFF1A
        </p>
        
        <div style="background: linear-gradient(135deg, #f8f4f0 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8B7355;">
          <h3 style="margin: 0 0 20px 0; color: #8B7355; font-size: 18px;">\u{1F4CB} \u8A02\u623F\u8CC7\u8A0A</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u623F\u578B</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${roomName}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u5165\u4F4F\u65E5\u671F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${checkInFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u9000\u623F\u65E5\u671F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${checkOutFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u4F4F\u5BBF\u665A\u6578</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${nights} \u665A</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u5165\u4F4F\u4EBA\u6578</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${numberOfGuests} \u4EBA</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">\u7E3D\u91D1\u984D</td><td style="padding: 12px 0; font-weight: bold; color: #8B7355; text-align: right; font-size: 18px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        ${specialRequests ? `
        <div style="background: #fff8e1; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin: 0 0 10px 0; color: #f57c00; font-size: 16px;">\u{1F4DD} \u7279\u6B8A\u9700\u6C42</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">${specialRequests}</p>
        </div>
        ` : ""}
        
        <div style="background: #e8f5e9; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 16px;">\u{1F3E6} \u9280\u884C\u8F49\u5E33\u8CC7\u8A0A</h4>
          <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">\u8ACB\u4F9D\u7167\u4EE5\u4E0B\u8CC7\u8A0A\u9032\u884C\u9280\u884C\u8F49\u5E33\uFF1A</p>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">\u9280\u884C</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">\u53F0\u7063\u9280\u884C</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">\u9280\u884C\u4EE3\u78BC</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">004</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">\u5E33\u865F</td><td style="padding: 8px 0; font-weight: bold; text-align: right; font-family: monospace;">123-456-789012</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">\u6236\u540D</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8</td></tr>
            </table>
          </div>
          <p style="margin: 15px 0 0 0; color: #666; font-size: 13px;">
            \u2705 \u8F49\u5E33\u5F8C\u8ACB\u900F\u904E LINE \u6216\u56DE\u8986\u90F5\u4EF6\u544A\u77E5\u8F49\u5E33\u5F8C\u4E94\u78BC\uFF0C\u4EE5\u4FBF\u6211\u5011\u78BA\u8A8D\u4ED8\u6B3E
          </p>
        </div>
        
        ${lineAddFriendBlock}
        
        <div style="text-align: center; margin: 25px 0;">
          <p style="color: #999; font-size: 13px; margin-bottom: 15px;">\u9700\u8981\u53D6\u6D88\u8A02\u55AE\u55CE\uFF1F</p>
          <a href="${baseUrl}/cancel-booking?bookingId=${bookingId}" 
             style="display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; 
                    border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
            \u53D6\u6D88\u8A02\u55AE
          </a>
        </div>
      </div>
      
      ${emailFooter}
    </div>
  `;
}
function generateAdminNotificationEmail(guestName, guestEmail, guestPhone, roomName, checkInDate, checkOutDate, numberOfGuests, totalPrice, bookingId, specialRequests) {
  const checkInFormatted = checkInDate.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });
  const checkOutFormatted = checkOutDate.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1e3 * 60 * 60 * 24));
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px 20px; text-align: center;">
        <div style="width: 70px; height: 70px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">\u{1F514}</span>
        </div>
        <h1 style="margin: 0; font-size: 22px; color: white; font-weight: 500;">\u65B0\u8A02\u623F\u901A\u77E5</h1>
        <div style="display: inline-block; background: #4CAF50; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px;">
          \u2713 \u5B98\u65B9\u7DB2\u7AD9\u8A02\u623F
        </div>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <strong style="color: #856404;">\u26A0\uFE0F \u65B0\u8A02\u623F\u7533\u8ACB\u5DF2\u6536\u5230\uFF0C\u8ACB\u76E1\u5FEB\u78BA\u8A8D</strong>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">\u{1F4CB} \u8A02\u623F\u8CC7\u8A0A</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #ddd;">#${bookingId}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">\u623F\u578B</td><td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #ddd;">${roomName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">\u5165\u4F4F\u65E5\u671F</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${checkInFormatted}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">\u9000\u623F\u65E5\u671F</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${checkOutFormatted}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">\u4F4F\u5BBF\u665A\u6578</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${nights} \u665A</td></tr>
            <tr><td style="padding: 8px 0; color: #666; border-bottom: 1px solid #ddd;">\u5165\u4F4F\u4EBA\u6578</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #ddd;">${numberOfGuests} \u4EBA</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">\u7E3D\u91D1\u984D</td><td style="padding: 8px 0; font-weight: bold; color: #ff9800; text-align: right; font-size: 18px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px;">\u{1F464} \u5BA2\u6236\u8CC7\u8A0A</h3>
          <p style="margin: 0; color: #333; line-height: 1.8;">
            \u59D3\u540D\uFF1A<strong>${guestName}</strong><br>
            \u96FB\u8A71\uFF1A<a href="tel:${guestPhone}" style="color: #1976d2; text-decoration: none;">${guestPhone}</a><br>
            \u90F5\u4EF6\uFF1A${guestEmail || "\u672A\u63D0\u4F9B"}
          </p>
        </div>
        
        ${specialRequests ? `
        <div style="background: #fff9e6; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <strong style="color: #856404;">\u{1F4DD} \u7279\u6B8A\u9700\u6C42\uFF1A</strong>
          <p style="margin: 10px 0 0 0; color: #666;">${specialRequests}</p>
        </div>
        ` : ""}
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          \u8ACB\u767B\u5165\u7BA1\u7406\u5F8C\u53F0\u78BA\u8A8D\u6B64\u8A02\u623F
        </p>
      </div>
    </div>
  `;
}
function generateBookingConfirmedEmail(guestName, bookingId, roomName, checkInDate, checkOutDate, totalPrice) {
  const checkInFormatted = checkInDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const checkOutFormatted = checkOutDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">\u2705</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">\u8A02\u623F\u5DF2\u78BA\u8A8D</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u60A8\u7684\u8A02\u623F\u5DF2\u6210\u529F\u78BA\u8A8D</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          \u89AA\u611B\u7684 <strong style="color: #4CAF50;">${guestName}</strong> \u60A8\u597D\uFF01
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u606D\u559C\uFF01\u60A8\u7684\u8A02\u623F\u5DF2\u78BA\u8A8D\uFF0C\u8ACB\u4F9D\u7167\u4ED8\u6B3E\u8CC7\u8A0A\u5B8C\u6210\u4ED8\u6B3E\u3002
        </p>
        
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin: 0 0 20px 0; color: #2e7d32; font-size: 18px;">\u{1F4CB} \u8A02\u623F\u8CC7\u8A0A</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u623F\u578B</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${roomName}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u5165\u4F4F\u65E5\u671F</td><td style="padding: 12px 0; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${checkInFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u9000\u623F\u65E5\u671F</td><td style="padding: 12px 0; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${checkOutFormatted}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">\u7E3D\u91D1\u984D</td><td style="padding: 12px 0; font-weight: bold; color: #4CAF50; text-align: right; font-size: 18px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        <div style="background: #e3f2fd; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2196F3;">
          <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px;">\u{1F3E6} \u9280\u884C\u8F49\u5E33\u8CC7\u8A0A</h4>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">\u9280\u884C</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">\u53F0\u7063\u9280\u884C</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">\u9280\u884C\u4EE3\u78BC</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">004</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">\u5E33\u865F</td><td style="padding: 8px 0; font-weight: bold; text-align: right; font-family: monospace;">123-456-789012</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">\u6236\u540D</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8</td></tr>
            </table>
          </div>
        </div>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}
function generatePaymentInstructionEmail(guestName, bookingId, totalPrice, bankName, accountNumber, accountName) {
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">\u{1F4B3}</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">\u4ED8\u6B3E\u8A73\u60C5</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u8ACB\u6309\u4EE5\u4E0B\u65B9\u5F0F\u9032\u884C\u9280\u884C\u8F49\u5E33</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          \u89AA\u611B\u7684 <strong style="color: #2196F3;">${guestName}</strong> \u60A8\u597D\uFF01
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u611F\u8B1D\u60A8\u7684\u8A02\u623F\u78BA\u8A8D\uFF01\u8ACB\u6309\u7167\u4EE5\u4E0B\u6307\u793A\u9032\u884C\u9280\u884C\u8F49\u5E33\uFF1A
        </p>
        
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2196F3;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #bbdefb;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #bbdefb;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">\u61C9\u4ED8\u91D1\u984D</td><td style="padding: 12px 0; font-weight: bold; color: #2196F3; text-align: right; font-size: 20px;">NT$ ${totalPrice}</td></tr>
          </table>
        </div>
        
        <div style="background: #f5f5f5; padding: 25px; border-radius: 12px; margin: 25px 0;">
          <h4 style="margin: 0 0 20px 0; color: #333; font-size: 16px;">\u{1F3E6} \u9280\u884C\u8F49\u5E33\u8CC7\u8A0A</h4>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">\u9280\u884C\u540D\u7A31</td><td style="padding: 10px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${bankName}</td></tr>
              <tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">\u5E33\u865F</td><td style="padding: 10px 0; font-weight: bold; text-align: right; font-family: monospace; border-bottom: 1px solid #eee;">${accountNumber}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;">\u6236\u540D</td><td style="padding: 10px 0; font-weight: bold; text-align: right;">${accountName}</td></tr>
            </table>
          </div>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 15px;">\u26A0\uFE0F \u91CD\u8981\u63D0\u9192</h4>
          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
            \u8ACB\u5728\u8F49\u5E33\u6642\u7684\u5099\u8A3B\u6B04\u586B\u5BEB\u8A02\u623F\u7DE8\u865F <strong>#${bookingId}</strong>\uFF0C\u4EE5\u4FBF\u6211\u5011\u5FEB\u901F\u78BA\u8A8D\u60A8\u7684\u4ED8\u6B3E\u3002
          </p>
        </div>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}
function generatePaymentConfirmedEmail(guestName, bookingId, totalPrice, checkInDate) {
  const checkInFormatted = checkInDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">\u{1F4B0}</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">\u4ED8\u6B3E\u5DF2\u78BA\u8A8D</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u60A8\u7684\u4ED8\u6B3E\u5DF2\u6210\u529F\u78BA\u8A8D</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          \u89AA\u611B\u7684 <strong style="color: #4CAF50;">${guestName}</strong> \u60A8\u597D\uFF01
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u611F\u8B1D\u60A8\u7684\u4ED8\u6B3E\uFF01\u6211\u5011\u5DF2\u6210\u529F\u6536\u5230\u60A8\u7684\u8F49\u5E33\uFF0C\u8A02\u623F\u5DF2\u78BA\u8A8D\u5B8C\u6210\u3002
        </p>
        
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin: 0 0 20px 0; color: #2e7d32; font-size: 18px;">\u2705 \u78BA\u8A8D\u8CC7\u8A0A</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u5DF2\u78BA\u8A8D\u91D1\u984D</td><td style="padding: 12px 0; font-weight: bold; color: #4CAF50; text-align: right; font-size: 18px; border-bottom: 1px solid #c8e6c9;">NT$ ${totalPrice}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">\u5165\u4F4F\u65E5\u671F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right;">${checkInFormatted}</td></tr>
          </table>
        </div>
        
        <div style="background: #fff8e1; padding: 20px; border-radius: 12px; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #f57c00; font-size: 16px;">\u23F0 \u5165\u4F4F\u9808\u77E5</h4>
          <div style="color: #666; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 8px 0;">\u2713 \u5165\u4F4F\u6642\u9593\uFF1A\u4E0B\u5348 3:00\uFF0815:00\uFF09\u8D77</p>
            <p style="margin: 0 0 8px 0;">\u2713 \u9000\u623F\u6642\u9593\uFF1A\u9694\u65E5\u4E2D\u5348 12:00 \u524D</p>
            <p style="margin: 0;">\u2713 \u5982\u9700\u63D0\u524D\u5165\u4F4F\u6216\u5EF6\u9072\u9000\u623F\uFF0C\u8ACB\u63D0\u524D\u806F\u7E6B\u6211\u5011</p>
          </div>
        </div>
        
        ${lineAddFriendBlock}
        
        <p style="color: #666; line-height: 1.8; font-size: 15px; text-align: center; margin-top: 30px;">
          \u6211\u5011\u671F\u5F85\u60A8\u7684\u5230\u4F86\uFF01\u{1F31F}
        </p>
      </div>
      
      ${emailFooter}
    </div>
  `;
}
function generateBookingCompletedEmail(guestName, bookingId, checkOutDate) {
  const checkOutFormatted = checkOutDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">\u{1F389}</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">\u611F\u8B1D\u60A8\u7684\u5165\u4F4F</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u671F\u5F85\u518D\u6B21\u70BA\u60A8\u670D\u52D9</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          \u89AA\u611B\u7684 <strong style="color: #9C27B0;">${guestName}</strong> \u60A8\u597D\uFF01
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u611F\u8B1D\u60A8\u9078\u64C7\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\uFF01\u5E0C\u671B\u60A8\u5728\u6211\u5011\u9019\u88E1\u5EA6\u904E\u4E86\u6109\u5FEB\u7684\u6642\u5149\u3002
        </p>
        
        <div style="background: linear-gradient(135deg, #f3e5f5 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #9C27B0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #e1bee7;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #e1bee7;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px;">\u9000\u623F\u65E5\u671F</td><td style="padding: 12px 0; color: #333; text-align: right;">${checkOutFormatted}</td></tr>
          </table>
        </div>
        
        <div style="background: linear-gradient(135deg, #fff9c4 0%, #fff 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px dashed #ffc107;">
          <h3 style="margin: 0 0 10px 0; color: #f57f17; font-size: 20px;">\u{1F381} \u5C08\u5C6C\u56DE\u994B\u512A\u60E0</h3>
          <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">\u611F\u8B1D\u60A8\u7684\u5165\u4F4F\uFF0C\u4E0B\u6B21\u8A02\u623F\u53EF\u4EAB\u5C08\u5C6C\u512A\u60E0\uFF01</p>
          <div style="background: #9C27B0; color: white; padding: 20px 30px; border-radius: 10px; display: inline-block;">
            <p style="margin: 0 0 5px 0; font-size: 14px;">\u512A\u60E0\u78BC</p>
            <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px;">THANKYOU10</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;">\u4EAB <strong>9 \u6298</strong> \u512A\u60E0</p>
          </div>
        </div>
        
        <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; color: #e65100; font-size: 18px;">\u2B50 \u60A8\u7684\u610F\u898B\u5F88\u91CD\u8981</h3>
          <p style="color: #666; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
            \u5982\u679C\u60A8\u5C0D\u6211\u5011\u7684\u670D\u52D9\u6EFF\u610F\uFF0C\u6B61\u8FCE\u5728 Google \u8A55\u8AD6\u7D66\u6211\u5011\u4E94\u661F\u597D\u8A55\uFF01
          </p>
          <a href="https://g.page/r/CastleHotelTainan/review" 
             style="display: inline-block; background: #4285f4; color: white; padding: 12px 30px; 
                    border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
            \u2B50 \u524D\u5F80\u8A55\u50F9
          </a>
        </div>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}
function generateBookingCancelledEmail(guestName, bookingId, reason) {
  return `
    <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 40px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">\u274C</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">\u8A02\u623F\u5DF2\u53D6\u6D88</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u60A8\u7684\u8A02\u623F\u5DF2\u88AB\u53D6\u6D88</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          \u89AA\u611B\u7684 <strong style="color: #f44336;">${guestName}</strong> \u60A8\u597D\uFF01
        </p>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u60A8\u7684\u8A02\u623F\u5DF2\u88AB\u53D6\u6D88\u3002\u4EE5\u4E0B\u662F\u53D6\u6D88\u8A73\u60C5\uFF1A
        </p>
        
        <div style="background: linear-gradient(135deg, #ffebee 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f44336;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #ffcdd2;">\u8A02\u623F\u7DE8\u865F</td><td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #ffcdd2;">#${bookingId}</td></tr>
            <tr><td style="padding: 12px 0; color: #888; font-size: 14px; ${reason ? "border-bottom: 1px solid #ffcdd2;" : ""}">\u72C0\u614B</td><td style="padding: 12px 0; font-weight: bold; color: #f44336; text-align: right; ${reason ? "border-bottom: 1px solid #ffcdd2;" : ""}">\u5DF2\u53D6\u6D88</td></tr>
            ${reason ? `<tr><td style="padding: 12px 0; color: #888; font-size: 14px;">\u53D6\u6D88\u539F\u56E0</td><td style="padding: 12px 0; color: #333; text-align: right;">${reason}</td></tr>` : ""}
          </table>
        </div>
        
        <p style="color: #666; line-height: 1.8; font-size: 15px;">
          \u5982\u6709\u4EFB\u4F55\u554F\u984C\u6216\u9700\u8981\u91CD\u65B0\u9810\u8A02\uFF0C\u6B61\u8FCE\u96A8\u6642\u806F\u7D61\u6211\u5011\u3002
        </p>
        
        ${lineAddFriendBlock}
      </div>
      
      ${emailFooter}
    </div>
  `;
}

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/routers.ts
import bcrypt from "bcrypt";

// server/_core/jwt.ts
import jwt from "jsonwebtoken";
function sign(payload) {
  return jwt.sign(payload, ENV.cookieSecret, {
    expiresIn: "7d"
  });
}
function verify(token) {
  return jwt.verify(token, ENV.cookieSecret);
}

// server/routers.booking-reminders.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
var bookingRemindersRouter = router({
  /**
   * 獲取待確認訂單列表
   * 用於自動提醒系統
   */
  getPendingBookings: adminProcedure.query(async () => {
    try {
      const allBookings = await getAllBookings();
      const pendingBookings = allBookings.filter((b) => b.status === "pending");
      return pendingBookings;
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u5F85\u78BA\u8A8D\u8A02\u55AE"
      });
    }
  }),
  /**
   * 獲取待付款訂單列表（超過 3 天）
   * 用於自動提醒系統
   */
  getOverduePaymentBookings: adminProcedure.query(async () => {
    try {
      const allBookings = await getAllBookings();
      const threeDaysAgo = /* @__PURE__ */ new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const overdueBookings = allBookings.filter(
        (b) => b.status === "pending_payment" && new Date(b.createdAt) < threeDaysAgo
      );
      return overdueBookings;
    } catch (error) {
      console.error("Error fetching overdue payment bookings:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u5F85\u4ED8\u6B3E\u8A02\u55AE"
      });
    }
  }),
  /**
   * 獲取明日入住的訂單列表
   * 用於自動提醒系統
   */
  getTomorrowCheckInBookings: adminProcedure.query(async () => {
    try {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const allBookings = await getAllBookings();
      const tomorrowBookings = allBookings.filter((b) => {
        const checkInDate = new Date(b.checkInDate).toISOString().split("T")[0];
        return checkInDate === tomorrowStr && (b.status === "paid" || b.status === "cash_on_site");
      });
      return tomorrowBookings;
    } catch (error) {
      console.error("Error fetching tomorrow check-in bookings:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u660E\u65E5\u5165\u4F4F\u8A02\u55AE"
      });
    }
  }),
  /**
   * 發送提醒郵件給客戶
   */
  sendReminderEmail: adminProcedure.input(z2.object({
    bookingId: z2.number(),
    reminderType: z2.enum(["pending", "payment", "checkin"])
  })).mutation(async ({ input }) => {
    try {
      const booking = await getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u8A02\u55AE\u4E0D\u5B58\u5728"
        });
      }
      let subject = "";
      let emailContent = "";
      switch (input.reminderType) {
        case "pending":
          subject = "\u8A02\u623F\u78BA\u8A8D\u63D0\u9192 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928";
          emailContent = `
              <p>\u89AA\u611B\u7684 ${booking.guestName}\uFF0C</p>
              <p>\u611F\u8B1D\u60A8\u7684\u8A02\u623F\uFF01\u6211\u5011\u5DF2\u6536\u5230\u60A8\u7684\u8A02\u623F\u7533\u8ACB\uFF0C\u6B63\u5728\u9032\u884C\u5BE9\u6838\u3002</p>
              <p><strong>\u8A02\u55AE\u7DE8\u865F\uFF1A</strong> ${booking.id}</p>
              <p><strong>\u5165\u4F4F\u65E5\u671F\uFF1A</strong> ${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}</p>
              <p><strong>\u9000\u623F\u65E5\u671F\uFF1A</strong> ${new Date(booking.checkOutDate).toLocaleDateString("zh-TW")}</p>
              <p>\u6211\u5011\u5C07\u5728 24 \u5C0F\u6642\u5167\u78BA\u8A8D\u60A8\u7684\u8A02\u623F\u3002\u5982\u6709\u4EFB\u4F55\u554F\u984C\uFF0C\u8ACB\u806F\u7E6B\u6211\u5011\u3002</p>
              <p>\u806F\u7E6B\u96FB\u8A71\uFF1A06-635-9577</p>
              <p>\u8B1D\u8B1D\uFF01</p>
            `;
          break;
        case "payment":
          subject = "\u5F85\u4ED8\u6B3E\u63D0\u9192 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928";
          emailContent = `
              <p>\u89AA\u611B\u7684 ${booking.guestName}\uFF0C</p>
              <p>\u60A8\u7684\u8A02\u623F\u5DF2\u78BA\u8A8D\uFF0C\u8ACB\u76E1\u5FEB\u5B8C\u6210\u652F\u4ED8\u3002</p>
              <p><strong>\u8A02\u55AE\u7DE8\u865F\uFF1A</strong> ${booking.id}</p>
              <p><strong>\u61C9\u4ED8\u91D1\u984D\uFF1A</strong> NT$ ${booking.totalPrice}</p>
              <p><strong>\u652F\u4ED8\u65B9\u5F0F\uFF1A</strong> \u9280\u884C\u8F49\u5E33</p>
              <p>\u9280\u884C\u5E33\u6236\u8CC7\u8A0A\u5DF2\u767C\u9001\u81F3\u60A8\u7684\u90F5\u7BB1\uFF0C\u8ACB\u67E5\u6536\u3002</p>
              <p>\u5982\u6709\u4EFB\u4F55\u554F\u984C\uFF0C\u8ACB\u806F\u7E6B\u6211\u5011\u3002</p>
              <p>\u806F\u7E6B\u96FB\u8A71\uFF1A06-635-9577</p>
              <p>\u8B1D\u8B1D\uFF01</p>
            `;
          break;
        case "checkin":
          subject = "\u5165\u4F4F\u63D0\u9192 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928";
          emailContent = `
              <p>\u89AA\u611B\u7684 ${booking.guestName}\uFF0C</p>
              <p>\u60A8\u5373\u5C07\u5165\u4F4F\u6211\u5011\u7684\u65C5\u9928\uFF01</p>
              <p><strong>\u8A02\u55AE\u7DE8\u865F\uFF1A</strong> ${booking.id}</p>
              <p><strong>\u5165\u4F4F\u65E5\u671F\uFF1A</strong> ${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}</p>
              <p>\u6211\u5011\u5DF2\u70BA\u60A8\u6E96\u5099\u597D\u623F\u9593\uFF0C\u671F\u5F85\u60A8\u7684\u5230\u4F86\uFF01</p>
              <p>\u5165\u4F4F\u6642\u9593\uFF1A\u4E0B\u5348 3:00 \u8D77</p>
              <p>\u5982\u9700\u63D0\u524D\u5165\u4F4F\uFF0C\u8ACB\u63D0\u524D\u806F\u7E6B\u6211\u5011\u3002</p>
              <p>\u806F\u7E6B\u96FB\u8A71\uFF1A06-635-9577</p>
              <p>\u8B1D\u8B1D\uFF01</p>
            `;
          break;
      }
      if (booking.guestEmail) {
        await sendEmail(
          booking.guestEmail,
          subject,
          emailContent
        );
      }
      return { success: true, message: "\u63D0\u9192\u90F5\u4EF6\u5DF2\u767C\u9001" };
    } catch (error) {
      console.error("Error sending reminder email:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u767C\u9001\u63D0\u9192\u90F5\u4EF6"
      });
    }
  }),
  /**
   * 批量確認訂單
   */
  batchConfirmBookings: adminProcedure.input(z2.object({
    bookingIds: z2.array(z2.number())
  })).mutation(async ({ input }) => {
    try {
      const results = [];
      for (const bookingId of input.bookingIds) {
        const booking = await getBookingById(bookingId);
        if (!booking) {
          results.push({ bookingId, success: false, error: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
          continue;
        }
        await updateBookingStatus(bookingId, "confirmed");
        try {
          if (booking.guestEmail) {
            await sendEmail(
              booking.guestEmail,
              "\u8A02\u623F\u5DF2\u78BA\u8A8D - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928",
              `
                  <p>\u89AA\u611B\u7684 ${booking.guestName}\uFF0C</p>
                  <p>\u60A8\u7684\u8A02\u623F\u5DF2\u78BA\u8A8D\uFF01</p>
                  <p><strong>\u8A02\u55AE\u7DE8\u865F\uFF1A</strong> ${booking.id}</p>
                  <p><strong>\u5165\u4F4F\u65E5\u671F\uFF1A</strong> ${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}</p>
                  <p><strong>\u9000\u623F\u65E5\u671F\uFF1A</strong> ${new Date(booking.checkOutDate).toLocaleDateString("zh-TW")}</p>
                  <p><strong>\u61C9\u4ED8\u91D1\u984D\uFF1A</strong> NT$ ${booking.totalPrice}</p>
                  <p>\u8ACB\u9078\u64C7\u652F\u4ED8\u65B9\u5F0F\u4E26\u5B8C\u6210\u652F\u4ED8\u3002\u8B1D\u8B1D\uFF01</p>
                `
            );
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }
        results.push({ bookingId, success: true });
      }
      return { success: true, results };
    } catch (error) {
      console.error("Error batch confirming bookings:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u6279\u91CF\u78BA\u8A8D\u8A02\u55AE"
      });
    }
  }),
  /**
   * 批量發送郵件
   */
  batchSendEmail: adminProcedure.input(z2.object({
    bookingIds: z2.array(z2.number()),
    subject: z2.string(),
    message: z2.string()
  })).mutation(async ({ input }) => {
    try {
      const results = [];
      for (const bookingId of input.bookingIds) {
        const booking = await getBookingById(bookingId);
        if (!booking) {
          results.push({ bookingId, success: false, error: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
          continue;
        }
        try {
          if (booking.guestEmail) {
            await sendEmail(
              booking.guestEmail,
              input.subject,
              `
                  <p>\u89AA\u611B\u7684 ${booking.guestName}\uFF0C</p>
                  <p>${input.message}</p>
                  <p><strong>\u8A02\u55AE\u7DE8\u865F\uFF1A</strong> ${booking.id}</p>
                  <p>\u8B1D\u8B1D\uFF01</p>
                `
            );
          }
          results.push({ bookingId, success: true });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          results.push({ bookingId, success: false, error: "\u90F5\u4EF6\u767C\u9001\u5931\u6557" });
        }
      }
      return { success: true, results };
    } catch (error) {
      console.error("Error batch sending emails:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u6279\u91CF\u767C\u9001\u90F5\u4EF6"
      });
    }
  }),
  /**
   * 批量取消訂單
   */
  batchCancelBookings: adminProcedure.input(z2.object({
    bookingIds: z2.array(z2.number()),
    reason: z2.string().optional()
  })).mutation(async ({ input }) => {
    try {
      const results = [];
      for (const bookingId of input.bookingIds) {
        const booking = await getBookingById(bookingId);
        if (!booking) {
          results.push({ bookingId, success: false, error: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
          continue;
        }
        await updateBookingStatus(bookingId, "cancelled");
        try {
          if (booking.guestEmail) {
            await sendEmail(
              booking.guestEmail,
              "\u8A02\u623F\u5DF2\u53D6\u6D88 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928",
              `
                  <p>\u89AA\u611B\u7684 ${booking.guestName}\uFF0C</p>
                  <p>\u60A8\u7684\u8A02\u623F\u5DF2\u53D6\u6D88\u3002</p>
                  <p><strong>\u8A02\u55AE\u7DE8\u865F\uFF1A</strong> ${booking.id}</p>
                  <p><strong>\u53D6\u6D88\u539F\u56E0\uFF1A</strong> ${input.reason || "\u5BA2\u6236\u7533\u8ACB"}</p>
                  <p>\u5982\u6709\u4EFB\u4F55\u554F\u984C\uFF0C\u8ACB\u806F\u7E6B\u6211\u5011\u3002</p>
                  <p>\u806F\u7E6B\u96FB\u8A71\uFF1A06-635-9577</p>
                `
            );
          }
        } catch (emailError) {
          console.error("Error sending cancellation email:", emailError);
        }
        results.push({ bookingId, success: true });
      }
      return { success: true, results };
    } catch (error) {
      console.error("Error batch cancelling bookings:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u6279\u91CF\u53D6\u6D88\u8A02\u55AE"
      });
    }
  })
});

// server/routers.data-export.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod";
import { eq as eq2, desc as desc2 } from "drizzle-orm";
import ExcelJS from "exceljs";
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError4({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var dataExportRouter = router({
  /**
   * 導出訂單數據為 Excel
   */
  exportBookingsExcel: adminProcedure2.input(
    z3.object({
      startDate: z3.string().optional(),
      endDate: z3.string().optional(),
      status: z3.string().optional()
    })
  ).mutation(async ({ input }) => {
    const { startDate, endDate, status } = input;
    const db = await getDb();
    if (!db) throw new Error("\u6578\u64DA\u5EAB\u9023\u63A5\u5931\u6557");
    let query = db.select({
      id: bookings.id,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      roomTypeId: bookings.roomTypeId,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      numberOfGuests: bookings.numberOfGuests,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      createdAt: bookings.createdAt,
      roomTypeName: roomTypes.name
    }).from(bookings).leftJoin(roomTypes, eq2(bookings.roomTypeId, roomTypes.id)).orderBy(desc2(bookings.createdAt));
    const bookingData = await query;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("\u8A02\u55AE\u6578\u64DA");
    worksheet.columns = [
      { header: "\u8A02\u55AE\u7DE8\u865F", key: "id", width: 12 },
      { header: "\u5BA2\u6236\u59D3\u540D", key: "guestName", width: 15 },
      { header: "\u96FB\u8A71", key: "guestPhone", width: 15 },
      { header: "\u96FB\u5B50\u90F5\u4EF6", key: "guestEmail", width: 25 },
      { header: "\u623F\u578B", key: "roomTypeName", width: 20 },
      { header: "\u5165\u4F4F\u65E5\u671F", key: "checkInDate", width: 12 },
      { header: "\u9000\u623F\u65E5\u671F", key: "checkOutDate", width: 12 },
      { header: "\u4EBA\u6578", key: "numberOfGuests", width: 8 },
      { header: "\u7E3D\u91D1\u984D", key: "totalPrice", width: 12 },
      { header: "\u72C0\u614B", key: "status", width: 12 },
      { header: "\u5275\u5EFA\u6642\u9593", key: "createdAt", width: 18 }
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    };
    const statusMap = {
      pending: "\u5F85\u78BA\u8A8D",
      confirmed: "\u5DF2\u78BA\u8A8D",
      pending_payment: "\u5F85\u4ED8\u6B3E",
      paid: "\u5DF2\u4ED8\u6B3E",
      cash_on_site: "\u73FE\u5834\u4ED8\u6B3E",
      completed: "\u5DF2\u5B8C\u6210",
      cancelled: "\u5DF2\u53D6\u6D88"
    };
    bookingData.forEach((booking) => {
      worksheet.addRow({
        id: booking.id,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail || "",
        roomTypeName: booking.roomTypeName || "\u672A\u77E5",
        checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("zh-TW") : "",
        checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("zh-TW") : "",
        numberOfGuests: booking.numberOfGuests,
        totalPrice: booking.totalPrice,
        status: statusMap[booking.status] || booking.status,
        createdAt: booking.createdAt ? new Date(booking.createdAt).toLocaleString("zh-TW") : ""
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      data: base64,
      filename: `\u8A02\u55AE\u6578\u64DA_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`
    };
  }),
  /**
   * 導出營收統計數據為 Excel
   */
  exportRevenueExcel: adminProcedure2.input(
    z3.object({
      startDate: z3.string().optional(),
      endDate: z3.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("\u6578\u64DA\u5EAB\u9023\u63A5\u5931\u6557");
    const allBookings = await db.select({
      roomTypeId: bookings.roomTypeId,
      totalPrice: bookings.totalPrice,
      roomTypeName: roomTypes.name
    }).from(bookings).leftJoin(roomTypes, eq2(bookings.roomTypeId, roomTypes.id)).where(eq2(bookings.status, "paid"));
    const revenueByRoomType = {};
    allBookings.forEach((booking) => {
      const roomTypeId = booking.roomTypeId?.toString() || "unknown";
      if (!revenueByRoomType[roomTypeId]) {
        revenueByRoomType[roomTypeId] = {
          count: 0,
          revenue: 0,
          name: booking.roomTypeName || "\u672A\u77E5"
        };
      }
      revenueByRoomType[roomTypeId].count++;
      revenueByRoomType[roomTypeId].revenue += Number(booking.totalPrice) || 0;
    });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("\u71DF\u6536\u7D71\u8A08");
    worksheet.columns = [
      { header: "\u623F\u578B", key: "roomTypeName", width: 20 },
      { header: "\u8A02\u55AE\u6578\u91CF", key: "bookingCount", width: 12 },
      { header: "\u7E3D\u71DF\u6536", key: "totalRevenue", width: 15 }
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    };
    let totalBookings = 0;
    let totalRevenue = 0;
    Object.values(revenueByRoomType).forEach((item) => {
      worksheet.addRow({
        roomTypeName: item.name,
        bookingCount: item.count,
        totalRevenue: item.revenue
      });
      totalBookings += item.count;
      totalRevenue += item.revenue;
    });
    worksheet.addRow({
      roomTypeName: "\u7E3D\u8A08",
      bookingCount: totalBookings,
      totalRevenue
    });
    const lastRow = worksheet.lastRow;
    if (lastRow) {
      lastRow.font = { bold: true };
      lastRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEB3B" }
      };
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      data: base64,
      filename: `\u71DF\u6536\u7D71\u8A08_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`
    };
  })
});

// server/routers.auto-reminders.ts
import { TRPCError as TRPCError5 } from "@trpc/server";

// server/auto-reminder-scheduler.ts
var LINE_ID2 = "@castle6359577";
var LINE_ADD_FRIEND_URL2 = "https://line.me/R/ti/p/@castle6359577";
var emailHeader = `
  <div style="background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); padding: 40px 20px; text-align: center;">
    <div style="max-width: 120px; margin: 0 auto 15px;">
      <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <span style="font-size: 36px; color: #8B7355; font-weight: bold;">E</span>
      </div>
    </div>
    <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 300; letter-spacing: 2px;">\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928</h1>
    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px; letter-spacing: 3px;">EUROPEAN CASTLE HOTEL</p>
  </div>
`;
var lineAddFriendBlock2 = `
  <div style="background: #06C755; padding: 25px; text-align: center; margin: 25px 0; border-radius: 12px;">
    <p style="margin: 0 0 15px 0; color: white; font-size: 16px; font-weight: 500;">
      \u{1F4F1} \u52A0\u5165\u5B98\u65B9 LINE \u597D\u53CB\uFF0C\u7372\u5F97\u5373\u6642\u670D\u52D9
    </p>
    <a href="${LINE_ADD_FRIEND_URL2}" 
       style="display: inline-block; background: white; color: #06C755; padding: 14px 40px; 
              border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s;">
      <span style="vertical-align: middle;">\u{1F517}</span> \u52A0\u5165\u597D\u53CB
    </a>
    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
      LINE ID: ${LINE_ID2}
    </p>
  </div>
`;
var emailFooter2 = `
  <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
    <div style="margin-bottom: 20px;">
      <a href="${LINE_ADD_FRIEND_URL2}" style="display: inline-block; margin: 0 8px;">
        <div style="width: 40px; height: 40px; background: #06C755; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 18px;">L</span>
        </div>
      </a>
      <a href="https://www.facebook.com/castlehoteltainan" style="display: inline-block; margin: 0 8px;">
        <div style="width: 40px; height: 40px; background: #1877F2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 18px;">f</span>
        </div>
      </a>
    </div>
    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
      <strong>\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928</strong>
    </p>
    <p style="margin: 0 0 5px 0; color: #888; font-size: 13px;">
      \u{1F4CD} \u53F0\u5357\u5E02\u65B0\u71DF\u5340\u9577\u69AE\u8DEF\u4E00\u6BB541\u865F
    </p>
    <p style="margin: 0 0 5px 0; color: #888; font-size: 13px;">
      \u{1F4DE} 06-635-9577 \uFF5C \u2709\uFE0F castle6359577@gmail.com
    </p>
    <p style="margin: 15px 0 0 0; color: #aaa; font-size: 11px;">
      \xA9 2026 \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8 All Rights Reserved.
    </p>
  </div>
`;
var emailTemplates = {
  // 入住前一天提醒郵件
  checkInReminder: (booking) => ({
    subject: "\u{1F3E8}\u3010\u660E\u65E5\u5165\u4F4F\u63D0\u9192\u3011\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u671F\u5F85\u60A8\u7684\u5230\u4F86",
    html: `
      <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        ${emailHeader}
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px;">\u{1F389}</span>
            <h2 style="margin: 15px 0 0 0; color: #333; font-size: 24px; font-weight: 500;">\u660E\u65E5\u5165\u4F4F\u63D0\u9192</h2>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            \u89AA\u611B\u7684 <strong style="color: #8B7355;">${booking.guestName}</strong> \u60A8\u597D\uFF01
          </p>
          
          <p style="color: #666; line-height: 1.8; font-size: 15px;">
            \u611F\u8B1D\u60A8\u9078\u64C7\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\uFF01\u63D0\u9192\u60A8\uFF0C\u60A8\u7684\u5165\u4F4F\u65E5\u671F\u662F<strong style="color: #8B7355;">\u660E\u5929</strong>\uFF0C\u6211\u5011\u5DF2\u70BA\u60A8\u6E96\u5099\u597D\u8212\u9069\u7684\u623F\u9593\uFF0C\u671F\u5F85\u60A8\u7684\u5230\u4F86\uFF01
          </p>
          
          <div style="background: linear-gradient(135deg, #f8f4f0 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8B7355;">
            <h3 style="margin: 0 0 20px 0; color: #8B7355; font-size: 18px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">\u{1F4CB}</span> \u8A02\u55AE\u8CC7\u8A0A
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u8A02\u55AE\u7DE8\u865F</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u5165\u4F4F\u65E5\u671F</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${new Date(booking.checkInDate).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #eee;">\u9000\u623F\u65E5\u671F</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">${new Date(booking.checkOutDate).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</td>
              </tr>
              ${booking.roomTypeName ? `
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px;">\u623F\u578B</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right;">${booking.roomTypeName}</td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          <div style="background: #fff8e1; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h4 style="margin: 0 0 15px 0; color: #f57c00; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">\u23F0</span> \u5165\u4F4F\u9808\u77E5
            </h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                <span style="margin-right: 10px;">\u2713</span> \u5165\u4F4F\u6642\u9593\uFF1A\u4E0B\u5348 3:00\uFF0815:00\uFF09\u8D77
              </div>
              <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                <span style="margin-right: 10px;">\u2713</span> \u9000\u623F\u6642\u9593\uFF1A\u9694\u65E5\u4E2D\u5348 12:00 \u524D
              </div>
              <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                <span style="margin-right: 10px;">\u2713</span> \u5982\u9700\u63D0\u524D\u5165\u4F4F\u6216\u5EF6\u9072\u9000\u623F\uFF0C\u8ACB\u63D0\u524D\u806F\u7E6B\u6211\u5011
              </div>
            </div>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">\u{1F4CD}</span> \u4EA4\u901A\u8CC7\u8A0A
            </h4>
            <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.8;">
              \u5730\u5740\uFF1A\u53F0\u5357\u5E02\u65B0\u71DF\u5340\u9577\u69AE\u8DEF\u4E00\u6BB541\u865F<br>
              <a href="https://maps.google.com/?q=\u53F0\u5357\u5E02\u65B0\u71DF\u5340\u9577\u69AE\u8DEF\u4E00\u6BB541\u865F" style="color: #1976d2; text-decoration: none;">\u{1F4CD} \u9EDE\u6B64\u958B\u555F Google \u5730\u5716\u5C0E\u822A</a>
            </p>
          </div>
          
          ${lineAddFriendBlock2}
          
          <p style="color: #666; line-height: 1.8; font-size: 15px; text-align: center; margin-top: 30px;">
            \u5982\u6709\u4EFB\u4F55\u554F\u984C\uFF0C\u6B61\u8FCE\u96A8\u6642\u8207\u6211\u5011\u806F\u7E6B\uFF01<br>
            \u6211\u5011\u671F\u5F85\u60A8\u7684\u5230\u4F86 \u{1F31F}
          </p>
        </div>
        
        ${emailFooter2}
      </div>
    `
  }),
  // 付款逾期提醒郵件（24小時）
  paymentOverdue: (booking) => ({
    subject: "\u26A0\uFE0F\u3010\u4ED8\u6B3E\u63D0\u9192\u3011\u8ACB\u76E1\u5FEB\u5B8C\u6210\u4ED8\u6B3E - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928",
    html: `
      <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); padding: 40px 20px; text-align: center;">
          <div style="max-width: 120px; margin: 0 auto 15px;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <span style="font-size: 36px;">\u26A0\uFE0F</span>
            </div>
          </div>
          <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 500;">\u4ED8\u6B3E\u63D0\u9192</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u8ACB\u76E1\u5FEB\u5B8C\u6210\u4ED8\u6B3E\u4EE5\u78BA\u4FDD\u8A02\u623F\u6709\u6548</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            \u89AA\u611B\u7684 <strong style="color: #ee5a5a;">${booking.guestName}</strong> \u60A8\u597D\uFF01
          </p>
          
          <p style="color: #666; line-height: 1.8; font-size: 15px;">
            \u6211\u5011\u6CE8\u610F\u5230\u60A8\u7684\u8A02\u55AE\u5C1A\u672A\u5B8C\u6210\u4ED8\u6B3E\u3002\u70BA\u78BA\u4FDD\u60A8\u7684\u8A02\u623F\u6709\u6548\uFF0C\u8ACB\u76E1\u5FEB\u5B8C\u6210\u4ED8\u6B3E\u3002
          </p>
          
          <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ff9800;">
            <h3 style="margin: 0 0 20px 0; color: #e65100; font-size: 18px;">
              \u{1F4CB} \u8A02\u55AE\u8CC7\u8A0A
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #ffe0b2;">\u8A02\u55AE\u7DE8\u865F</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #ffe0b2;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #ffe0b2;">\u5165\u4F4F\u65E5\u671F</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #ffe0b2;">${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px;">\u61C9\u4ED8\u91D1\u984D</td>
                <td style="padding: 12px 0; font-weight: bold; color: #ee5a5a; text-align: right; font-size: 20px;">NT$ ${booking.totalPrice}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #f5f5f5; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h4 style="margin: 0 0 20px 0; color: #333; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">\u{1F4B3}</span> \u4ED8\u6B3E\u65B9\u5F0F\uFF1A\u9280\u884C\u8F49\u5E33
            </h4>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">\u9280\u884C\u540D\u7A31</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">\u53F0\u7063\u9280\u884C</td>
              </tr>
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">\u9280\u884C\u4EE3\u78BC</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee;">004</td>
              </tr>
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">\u5E33\u865F</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #eee; font-family: monospace; letter-spacing: 1px;">123-456-789012</td>
              </tr>
              <tr>
                <td style="padding: 15px; color: #666; font-size: 14px;">\u6236\u540D</td>
                <td style="padding: 15px; font-weight: bold; color: #333; text-align: right;">\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ffebee; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; color: #c62828; font-weight: bold; font-size: 15px;">
              \u23F0 \u8ACB\u65BC\u5165\u4F4F\u524D\u5B8C\u6210\u4ED8\u6B3E\uFF0C\u4EE5\u78BA\u4FDD\u60A8\u7684\u8A02\u623F\u6709\u6548
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.8; font-size: 14px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
            \u{1F4A1} <strong>\u6EAB\u99A8\u63D0\u793A\uFF1A</strong>\u5B8C\u6210\u8F49\u5E33\u5F8C\uFF0C\u8ACB\u900F\u904E LINE \u6216\u96FB\u8A71\u544A\u77E5\u6211\u5011\u8F49\u5E33\u5E33\u865F\u5F8C\u4E94\u78BC\uFF0C\u4EE5\u4FBF\u6211\u5011\u78BA\u8A8D\u60A8\u7684\u4ED8\u6B3E\u3002
          </p>
          
          ${lineAddFriendBlock2}
        </div>
        
        ${emailFooter2}
      </div>
    `
  }),
  // 退房感謝郵件
  checkOutThankYou: (booking) => ({
    subject: "\u{1F49D}\u3010\u611F\u8B1D\u5165\u4F4F\u3011\u671F\u5F85\u518D\u6B21\u76F8\u898B - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928",
    html: `
      <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 20px; text-align: center;">
          <div style="max-width: 120px; margin: 0 auto 15px;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <span style="font-size: 36px;">\u{1F64F}</span>
            </div>
          </div>
          <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 500;">\u611F\u8B1D\u60A8\u7684\u5165\u4F4F</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">\u671F\u5F85\u518D\u6B21\u70BA\u60A8\u670D\u52D9</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            \u89AA\u611B\u7684 <strong style="color: #4CAF50;">${booking.guestName}</strong> \u60A8\u597D\uFF01
          </p>
          
          <p style="color: #666; line-height: 1.8; font-size: 15px;">
            \u611F\u8B1D\u60A8\u9078\u64C7\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\uFF01\u5E0C\u671B\u60A8\u5728\u6211\u5011\u9019\u88E1\u5EA6\u904E\u4E86\u6109\u5FEB\u7684\u6642\u5149\u3002\u60A8\u7684\u6EFF\u610F\u662F\u6211\u5011\u6700\u5927\u7684\u69AE\u5E78\uFF01
          </p>
          
          <div style="background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin: 0 0 20px 0; color: #2e7d32; font-size: 18px;">
              \u{1F4CB} \u5165\u4F4F\u7D00\u9304
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u8A02\u55AE\u7DE8\u865F</td>
                <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px; border-bottom: 1px solid #c8e6c9;">\u5165\u4F4F\u65E5\u671F</td>
                <td style="padding: 12px 0; color: #333; text-align: right; border-bottom: 1px solid #c8e6c9;">${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 14px;">\u9000\u623F\u65E5\u671F</td>
                <td style="padding: 12px 0; color: #333; text-align: right;">${new Date(booking.checkOutDate).toLocaleDateString("zh-TW")}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: linear-gradient(135deg, #fff9c4 0%, #fff 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px dashed #ffc107;">
            <h3 style="margin: 0 0 10px 0; color: #f57f17; font-size: 20px;">\u{1F381} \u5C08\u5C6C\u56DE\u994B\u512A\u60E0</h3>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">\u611F\u8B1D\u60A8\u7684\u5165\u4F4F\uFF0C\u4E0B\u6B21\u8A02\u623F\u53EF\u4EAB\u5C08\u5C6C\u512A\u60E0\uFF01</p>
            <div style="background: #4CAF50; color: white; padding: 20px 30px; border-radius: 10px; display: inline-block;">
              <p style="margin: 0 0 5px 0; font-size: 14px;">\u512A\u60E0\u78BC</p>
              <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px;">THANKYOU10</p>
              <p style="margin: 10px 0 0 0; font-size: 16px;">\u4EAB <strong>9 \u6298</strong> \u512A\u60E0</p>
            </div>
            <p style="color: #888; margin: 15px 0 0 0; font-size: 12px;">* \u8A02\u623F\u6642\u8ACB\u544A\u77E5\u6B64\u512A\u60E0\u78BC</p>
          </div>
          
          <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #e65100; font-size: 18px;">\u2B50 \u60A8\u7684\u610F\u898B\u5F88\u91CD\u8981</h3>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
              \u5982\u679C\u60A8\u5C0D\u6211\u5011\u7684\u670D\u52D9\u6EFF\u610F\uFF0C\u6B61\u8FCE\u5728 Google \u8A55\u8AD6\u7D66\u6211\u5011\u4E94\u661F\u597D\u8A55\uFF01<br>
              \u60A8\u7684\u652F\u6301\u662F\u6211\u5011\u9032\u6B65\u7684\u52D5\u529B \u{1F4AA}
            </p>
            <a href="https://g.page/r/CastleHotelTainan/review" 
               style="display: inline-block; background: #4285f4; color: white; padding: 12px 30px; 
                      border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
              \u2B50 \u524D\u5F80\u8A55\u50F9
            </a>
          </div>
          
          ${lineAddFriendBlock2}
          
          <p style="color: #666; line-height: 1.8; font-size: 15px; text-align: center; margin-top: 30px;">
            \u671F\u5F85\u4E0B\u6B21\u518D\u70BA\u60A8\u670D\u52D9\uFF01<br>
            \u795D\u60A8\u65C5\u9014\u6109\u5FEB \u{1F31F}
          </p>
        </div>
        
        ${emailFooter2}
      </div>
    `
  })
};
async function getTomorrowCheckInBookings() {
  const tomorrow = /* @__PURE__ */ new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const allBookings = await getAllBookings();
  return allBookings.filter((b) => {
    const checkInDate = new Date(b.checkInDate).toISOString().split("T")[0];
    return checkInDate === tomorrowStr && (b.status === "paid" || b.status === "cash_on_site" || b.status === "confirmed");
  });
}
async function getOverdue24HoursPaymentBookings() {
  const oneDayAgo = /* @__PURE__ */ new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const allBookings = await getAllBookings();
  return allBookings.filter(
    (b) => b.status === "pending_payment" && new Date(b.updatedAt || b.createdAt) < oneDayAgo
  );
}
async function getTodayCheckOutBookings() {
  const today = /* @__PURE__ */ new Date();
  const todayStr = today.toISOString().split("T")[0];
  const allBookings = await getAllBookings();
  return allBookings.filter((b) => {
    const checkOutDate = new Date(b.checkOutDate).toISOString().split("T")[0];
    return checkOutDate === todayStr && b.status === "completed";
  });
}
async function sendCheckInReminders() {
  const bookings2 = await getTomorrowCheckInBookings();
  const results = [];
  for (const booking of bookings2) {
    try {
      if (booking.guestEmail) {
        const template = emailTemplates.checkInReminder(booking);
        await sendEmail(booking.guestEmail, template.subject, template.html);
        results.push({ bookingId: booking.id, success: true });
        console.log(`[AutoReminder] \u5165\u4F4F\u63D0\u9192\u5DF2\u767C\u9001: \u8A02\u55AE #${booking.id}`);
      } else {
        results.push({ bookingId: booking.id, success: false, error: "\u7121\u5BA2\u6236\u90F5\u7BB1" });
      }
    } catch (error) {
      console.error(`[AutoReminder] \u767C\u9001\u5165\u4F4F\u63D0\u9192\u5931\u6557: \u8A02\u55AE #${booking.id}`, error);
      results.push({ bookingId: booking.id, success: false, error: String(error) });
    }
  }
  return { type: "checkInReminder", total: bookings2.length, results };
}
async function sendPaymentOverdueReminders() {
  const bookings2 = await getOverdue24HoursPaymentBookings();
  const results = [];
  for (const booking of bookings2) {
    try {
      if (booking.guestEmail) {
        const template = emailTemplates.paymentOverdue(booking);
        await sendEmail(booking.guestEmail, template.subject, template.html);
        results.push({ bookingId: booking.id, success: true });
        console.log(`[AutoReminder] \u4ED8\u6B3E\u63D0\u9192\u5DF2\u767C\u9001: \u8A02\u55AE #${booking.id}`);
      } else {
        results.push({ bookingId: booking.id, success: false, error: "\u7121\u5BA2\u6236\u90F5\u7BB1" });
      }
    } catch (error) {
      console.error(`[AutoReminder] \u767C\u9001\u4ED8\u6B3E\u63D0\u9192\u5931\u6557: \u8A02\u55AE #${booking.id}`, error);
      results.push({ bookingId: booking.id, success: false, error: String(error) });
    }
  }
  return { type: "paymentOverdue", total: bookings2.length, results };
}
async function sendCheckOutThankYouEmails() {
  const bookings2 = await getTodayCheckOutBookings();
  const results = [];
  for (const booking of bookings2) {
    try {
      if (booking.guestEmail) {
        const template = emailTemplates.checkOutThankYou(booking);
        await sendEmail(booking.guestEmail, template.subject, template.html);
        results.push({ bookingId: booking.id, success: true });
        console.log(`[AutoReminder] \u611F\u8B1D\u90F5\u4EF6\u5DF2\u767C\u9001: \u8A02\u55AE #${booking.id}`);
      } else {
        results.push({ bookingId: booking.id, success: false, error: "\u7121\u5BA2\u6236\u90F5\u7BB1" });
      }
    } catch (error) {
      console.error(`[AutoReminder] \u767C\u9001\u611F\u8B1D\u90F5\u4EF6\u5931\u6557: \u8A02\u55AE #${booking.id}`, error);
      results.push({ bookingId: booking.id, success: false, error: String(error) });
    }
  }
  return { type: "checkOutThankYou", total: bookings2.length, results };
}
async function runAllAutoReminders() {
  console.log("[AutoReminder] \u958B\u59CB\u57F7\u884C\u81EA\u52D5\u63D0\u9192\u4EFB\u52D9...");
  const startTime = /* @__PURE__ */ new Date();
  const results = {
    checkInReminder: await sendCheckInReminders(),
    paymentOverdue: await sendPaymentOverdueReminders(),
    checkOutThankYou: await sendCheckOutThankYouEmails(),
    executedAt: startTime.toISOString(),
    duration: Date.now() - startTime.getTime()
  };
  console.log("[AutoReminder] \u81EA\u52D5\u63D0\u9192\u4EFB\u52D9\u5B8C\u6210:", JSON.stringify(results, null, 2));
  return results;
}

// server/routers.auto-reminders.ts
var adminProcedure3 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError5({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var autoRemindersRouter = router({
  /**
   * 獲取明天入住的訂單列表
   */
  getTomorrowCheckIns: adminProcedure3.query(async () => {
    try {
      const bookings2 = await getTomorrowCheckInBookings();
      return {
        success: true,
        count: bookings2.length,
        bookings: bookings2.map((b) => ({
          id: b.id,
          guestName: b.guestName,
          guestEmail: b.guestEmail,
          guestPhone: b.guestPhone,
          checkInDate: b.checkInDate,
          status: b.status
        }))
      };
    } catch (error) {
      console.error("Error getting tomorrow check-ins:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u660E\u65E5\u5165\u4F4F\u8A02\u55AE"
      });
    }
  }),
  /**
   * 獲取超過 24 小時未付款的訂單列表
   */
  getOverduePayments: adminProcedure3.query(async () => {
    try {
      const bookings2 = await getOverdue24HoursPaymentBookings();
      return {
        success: true,
        count: bookings2.length,
        bookings: bookings2.map((b) => ({
          id: b.id,
          guestName: b.guestName,
          guestEmail: b.guestEmail,
          guestPhone: b.guestPhone,
          checkInDate: b.checkInDate,
          totalPrice: b.totalPrice,
          createdAt: b.createdAt,
          status: b.status
        }))
      };
    } catch (error) {
      console.error("Error getting overdue payments:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u903E\u671F\u4ED8\u6B3E\u8A02\u55AE"
      });
    }
  }),
  /**
   * 獲取今天退房的訂單列表
   */
  getTodayCheckOuts: adminProcedure3.query(async () => {
    try {
      const bookings2 = await getTodayCheckOutBookings();
      return {
        success: true,
        count: bookings2.length,
        bookings: bookings2.map((b) => ({
          id: b.id,
          guestName: b.guestName,
          guestEmail: b.guestEmail,
          checkOutDate: b.checkOutDate,
          status: b.status
        }))
      };
    } catch (error) {
      console.error("Error getting today check-outs:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u4ECA\u65E5\u9000\u623F\u8A02\u55AE"
      });
    }
  }),
  /**
   * 手動發送入住提醒郵件
   */
  sendCheckInReminders: adminProcedure3.mutation(async () => {
    try {
      const result = await sendCheckInReminders();
      return {
        success: true,
        message: `\u5DF2\u767C\u9001 ${result.results.filter((r) => r.success).length}/${result.total} \u5C01\u5165\u4F4F\u63D0\u9192\u90F5\u4EF6`,
        details: result
      };
    } catch (error) {
      console.error("Error sending check-in reminders:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u767C\u9001\u5165\u4F4F\u63D0\u9192\u5931\u6557"
      });
    }
  }),
  /**
   * 手動發送付款逾期提醒郵件
   */
  sendPaymentReminders: adminProcedure3.mutation(async () => {
    try {
      const result = await sendPaymentOverdueReminders();
      return {
        success: true,
        message: `\u5DF2\u767C\u9001 ${result.results.filter((r) => r.success).length}/${result.total} \u5C01\u4ED8\u6B3E\u63D0\u9192\u90F5\u4EF6`,
        details: result
      };
    } catch (error) {
      console.error("Error sending payment reminders:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u767C\u9001\u4ED8\u6B3E\u63D0\u9192\u5931\u6557"
      });
    }
  }),
  /**
   * 手動發送退房感謝郵件
   */
  sendThankYouEmails: adminProcedure3.mutation(async () => {
    try {
      const result = await sendCheckOutThankYouEmails();
      return {
        success: true,
        message: `\u5DF2\u767C\u9001 ${result.results.filter((r) => r.success).length}/${result.total} \u5C01\u611F\u8B1D\u90F5\u4EF6`,
        details: result
      };
    } catch (error) {
      console.error("Error sending thank you emails:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u767C\u9001\u611F\u8B1D\u90F5\u4EF6\u5931\u6557"
      });
    }
  }),
  /**
   * 執行所有自動提醒任務
   */
  runAllReminders: adminProcedure3.mutation(async () => {
    try {
      const result = await runAllAutoReminders();
      return {
        success: true,
        message: "\u6240\u6709\u81EA\u52D5\u63D0\u9192\u4EFB\u52D9\u5DF2\u57F7\u884C\u5B8C\u6210",
        details: result
      };
    } catch (error) {
      console.error("Error running all reminders:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u57F7\u884C\u81EA\u52D5\u63D0\u9192\u4EFB\u52D9\u5931\u6557"
      });
    }
  }),
  /**
   * 獲取自動提醒統計
   */
  getStats: adminProcedure3.query(async () => {
    try {
      const [tomorrowCheckIns, overduePayments, todayCheckOuts] = await Promise.all([
        getTomorrowCheckInBookings(),
        getOverdue24HoursPaymentBookings(),
        getTodayCheckOutBookings()
      ]);
      return {
        success: true,
        stats: {
          tomorrowCheckIns: tomorrowCheckIns.length,
          overduePayments: overduePayments.length,
          todayCheckOuts: todayCheckOuts.length
        }
      };
    } catch (error) {
      console.error("Error getting reminder stats:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u7121\u6CD5\u7372\u53D6\u63D0\u9192\u7D71\u8A08"
      });
    }
  })
});

// server/_core/booking-ical-sync.ts
var BOOKING_PROPERTY_ID = "1073128";
var BOOKING_ICAL_URL = `https://secure.booking.com/ical/${BOOKING_PROPERTY_ID}.ics`;
var SYNC_INTERVAL = 15 * 60 * 1e3;
var syncInterval = null;
function startBookingCalendarSync() {
  if (syncInterval) return;
  console.log("[Booking.com iCal] \u555F\u52D5\u540C\u6B65\u5B9A\u65F6\u5668");
  syncBookingCalendar();
  syncInterval = setInterval(syncBookingCalendar, SYNC_INTERVAL);
}
function stopBookingCalendarSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[Booking.com iCal] \u5DF2\u505C\u6B62\u540C\u6B65");
  }
}
async function syncBookingCalendar() {
  try {
    console.log("[Booking.com iCal] \u958B\u59CB\u540C\u6B65...");
    const response = await fetch(BOOKING_ICAL_URL, {
      headers: {
        "User-Agent": "European-Castle-Hotel/1.0"
      }
    });
    if (!response.ok) {
      console.error(`[Booking.com iCal] HTTP ${response.status}: ${response.statusText}`);
      return;
    }
    const icsData = await response.text();
    const events = parseBookingEvents(icsData);
    console.log(`[Booking.com iCal] \u627E\u5230 ${events.length} \u500B\u4E8B\u4EF6`);
    for (const event of events) {
      await processBookingEvent(event);
    }
    console.log("[Booking.com iCal] \u540C\u6B65\u5B8C\u6210");
  } catch (error) {
    console.error("[Booking.com iCal] \u540C\u6B65\u932F\u8AA4:", error);
  }
}
function parseBookingEvents(icsData) {
  const events = [];
  try {
    const lines = icsData.split("\n");
    let currentEvent = null;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === "BEGIN:VEVENT") {
        currentEvent = {
          properties: {}
        };
      } else if (trimmedLine === "END:VEVENT" && currentEvent) {
        const event = currentEvent.properties;
        if (event.summary && event.dtstart && event.dtend) {
          const booking = {
            guestName: extractGuestName(event.summary),
            checkInDate: parseICalDate(event.dtstart),
            checkOutDate: parseICalDate(event.dtend),
            externalId: event.uid || `booking-${Date.now()}`
          };
          events.push(booking);
        }
        currentEvent = null;
      } else if (currentEvent && trimmedLine.includes(":")) {
        const [key, ...valueParts] = trimmedLine.split(":");
        const value = valueParts.join(":");
        currentEvent.properties[key] = value;
      }
    }
  } catch (error) {
    console.error("[Booking.com iCal] \u89E3\u6790\u9519\u8AA4:", error);
  }
  return events;
}
function extractGuestName(summary) {
  const match = summary.match(/- (.+)$/);
  return match ? match[1].trim() : summary;
}
function parseICalDate(dateStr) {
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  } else {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month - 1, day);
  }
}
async function processBookingEvent(event) {
  try {
    const existingBooking = await getBookingsByPhone(event.guestName);
    const isNew = !existingBooking.some(
      (b) => new Date(b.checkInDate).getTime() === event.checkInDate.getTime() && new Date(b.checkOutDate).getTime() === event.checkOutDate.getTime()
    );
    if (isNew) {
      console.log(`[Booking.com iCal] \u65B0\u9810\u8A02: ${event.guestName} (${event.checkInDate.toLocaleDateString()} - ${event.checkOutDate.toLocaleDateString()})`);
      const roomTypes2 = await getAllRoomTypes();
      for (const roomType of roomTypes2) {
        await createRoomBlockage(
          roomType.id,
          getDateRange(event.checkInDate, event.checkOutDate),
          `Booking.com \u9810\u8A02: ${event.guestName}`
        );
      }
    }
  } catch (error) {
    console.error(`[Booking.com iCal] \u8655\u7406\u9810\u8A02\u932F\u8AA4:`, error);
  }
}
function getDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate < endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
async function manualSyncBookingCalendar() {
  try {
    await syncBookingCalendar();
    return { success: true, message: "Booking.com iCal \u540C\u6B65\u6210\u529F" };
  } catch (error) {
    return { success: false, message: `\u540C\u6B65\u5931\u6557: ${error}` };
  }
}

// server/routers.ts
var adminProcedure4 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError6({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  bookingReminders: bookingRemindersRouter,
  dataExport: dataExportRouter,
  autoReminders: autoRemindersRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    login: publicProcedure.input(z4.object({
      username: z4.string(),
      password: z4.string()
    })).mutation(async ({ input, ctx }) => {
      const user = await getUserByUsername(input.username);
      if (!user || user.role !== "admin") {
        throw new TRPCError6({ code: "UNAUTHORIZED", message: "\u7528\u6236\u540D\u6216\u5BC6\u78BC\u932F\u8AA4" });
      }
      if (!user.passwordHash) {
        throw new TRPCError6({ code: "UNAUTHORIZED", message: "\u7528\u6236\u540D\u6216\u5BC6\u78BC\u932F\u8AA4" });
      }
      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError6({ code: "UNAUTHORIZED", message: "\u7528\u6236\u540D\u6216\u5BC6\u78BC\u932F\u8AA4" });
      }
      await updateUserLastSignedIn(user.id);
      const token = sign({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      };
    }),
    // 帳號管理 API
    listAdmins: adminProcedure4.query(async () => {
      const allUsers = await getAllUsers();
      return allUsers.filter((u) => u.role === "admin").map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        status: u.status,
        createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn
      }));
    }),
    createAdmin: adminProcedure4.input(z4.object({
      username: z4.string().min(3, "\u7528\u6236\u540D\u81F3\u5C113\u500B\u5B57\u7B26"),
      password: z4.string().min(6, "\u5BC6\u78BC\u81F3\u5C116\u500B\u5B57\u7B26"),
      name: z4.string().min(1, "\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A")
    })).mutation(async ({ input }) => {
      const existingUser = await getUserByUsername(input.username);
      if (existingUser) {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "\u7528\u6236\u540D\u5DF2\u5B58\u5728" });
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const userId = await upsertUser({
        username: input.username,
        passwordHash,
        name: input.name,
        role: "admin",
        loginMethod: "password"
      });
      const newUser = await getUserById(userId);
      return {
        success: true,
        user: newUser,
        message: `\u6210\u529F\u65B0\u589E\u7BA1\u7406\u54E1\u5E33\u865F\uFF1A${input.username}`
      };
    }),
    updateAdmin: adminProcedure4.input(z4.object({
      id: z4.number(),
      name: z4.string().optional(),
      password: z4.string().min(6, "\u5BC6\u78BC\u81F3\u5C116\u500B\u5B57\u7B26").optional(),
      status: z4.enum(["active", "inactive"]).optional()
    })).mutation(async ({ input }) => {
      const updateData = {};
      if (input.name) updateData.name = input.name;
      if (input.status) updateData.status = input.status;
      if (input.password) {
        updateData.passwordHash = await bcrypt.hash(input.password, 10);
      }
      await updateUser(input.id, updateData);
      return { success: true };
    }),
    deleteAdmin: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { success: true };
    })
  }),
  upload: router({
    image: protectedProcedure.input(z4.object({
      filename: z4.string(),
      data: z4.string()
    })).mutation(async ({ input, ctx }) => {
      try {
        const buffer = Buffer.from(input.data, "base64");
        const key = `room-images/${ctx.user.id}/${Date.now()}-${input.filename}`;
        const result = await storagePut(key, buffer, "image/jpeg");
        return { success: true, url: result.url, key: result.key };
      } catch (error) {
        console.error("Upload error:", error);
        throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Upload failed" });
      }
    })
  }),
  // Room Types
  roomTypes: router({
    list: publicProcedure.query(async () => {
      return await getAvailableRoomTypes();
    }),
    listAll: adminProcedure4.query(async () => {
      return await getAllRoomTypes();
    }),
    getById: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
      const roomType = await getRoomTypeById(input.id);
      if (!roomType) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Room type not found" });
      }
      return roomType;
    }),
    create: adminProcedure4.input(z4.object({
      name: z4.string(),
      nameEn: z4.string().optional(),
      description: z4.string(),
      descriptionEn: z4.string().optional(),
      size: z4.string().optional(),
      capacity: z4.number().default(2),
      price: z4.string(),
      weekendPrice: z4.string().optional(),
      images: z4.string().optional(),
      amenities: z4.string().optional(),
      displayOrder: z4.number().default(0),
      maxSalesQuantity: z4.number().default(10)
    })).mutation(async ({ input }) => {
      const id = await createRoomType(input);
      return { id, success: true };
    }),
    update: adminProcedure4.input(z4.object({
      id: z4.number(),
      name: z4.string().optional(),
      nameEn: z4.string().optional(),
      description: z4.string().optional(),
      descriptionEn: z4.string().optional(),
      size: z4.string().optional(),
      capacity: z4.number().optional(),
      price: z4.string().optional(),
      weekendPrice: z4.string().optional(),
      images: z4.string().optional(),
      amenities: z4.string().optional(),
      isAvailable: z4.boolean().optional(),
      displayOrder: z4.number().optional(),
      maxSalesQuantity: z4.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRoomType(id, data);
      return { success: true };
    }),
    delete: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await deleteRoomType(input.id);
      return { success: true };
    }),
    uploadImage: adminProcedure4.input(z4.object({
      imageBase64: z4.string()
    })).mutation(async ({ input }) => {
      const clientId = process.env.IMGUR_CLIENT_ID || "placeholder_client_id";
      if (clientId === "placeholder_client_id") {
        throw new TRPCError6({
          code: "PRECONDITION_FAILED",
          message: "Imgur Client ID not configured"
        });
      }
      try {
        const { uploadToImgur } = await import("../_core/imgur");
        const result = await uploadToImgur(input.imageBase64, clientId);
        return { url: result.url, deleteHash: result.deleteHash };
      } catch (error) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: `Image upload failed: ${error.message}`
        });
      }
    })
  }),
  // Bookings
  bookings: router({
    create: publicProcedure.input(z4.object({
      roomTypeId: z4.number(),
      guestName: z4.string(),
      guestEmail: z4.string().email().optional(),
      guestPhone: z4.string(),
      checkInDate: z4.union([z4.date(), z4.string()]),
      checkOutDate: z4.union([z4.date(), z4.string()]),
      numberOfGuests: z4.number().default(2),
      totalPrice: z4.string(),
      specialRequests: z4.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const parseDate = (dateInput) => {
        if (typeof dateInput === "string") {
          const parts = dateInput.split("-");
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          return new Date(year, month - 1, day, 0, 0, 0, 0);
        }
        return dateInput;
      };
      const checkInDate = parseDate(input.checkInDate);
      const checkOutDate = parseDate(input.checkOutDate);
      const isAvailable = await checkRoomAvailability(
        input.roomTypeId,
        checkInDate,
        checkOutDate
      );
      if (!isAvailable) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "Room is not available for selected dates"
        });
      }
      const canBook = await checkMaxSalesQuantity(
        input.roomTypeId,
        checkInDate,
        checkOutDate
      );
      if (!canBook) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "Reached maximum sales quantity for selected dates"
        });
      }
      const bookingData = {
        ...input,
        checkInDate,
        checkOutDate,
        userId: ctx.user?.id,
        status: "pending"
      };
      const id = await createBooking(bookingData);
      const roomType = await getRoomTypeById(input.roomTypeId);
      if (input.guestEmail) {
        const baseUrl = process.env.API_URL || "http://localhost:3000";
        const guestEmailHtml = generateBookingConfirmationEmail(
          input.guestName,
          roomType?.name || "\u623F\u578B",
          checkInDate,
          checkOutDate,
          input.numberOfGuests,
          input.totalPrice,
          id,
          input.specialRequests,
          baseUrl
        );
        await sendEmail(
          input.guestEmail,
          `\u8A02\u623F\u78BA\u8A8D - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${id})`,
          guestEmailHtml
        );
      }
      const adminEmail = "jason88488848@gmail.com";
      if (adminEmail) {
        const adminEmailHtml = generateAdminNotificationEmail(
          input.guestName,
          input.guestEmail || "\u672A\u63D0\u4F9B",
          input.guestPhone,
          roomType?.name || "\u623F\u578B",
          checkInDate,
          checkOutDate,
          input.numberOfGuests,
          input.totalPrice,
          id,
          input.specialRequests
        );
        await sendEmail(
          adminEmail,
          `\u65B0\u8A02\u623F\u901A\u77E5 - ${input.guestName} (\u8A02\u623F\u7DE8\u865F: #${id})`,
          adminEmailHtml
        );
      }
      await notifyOwner({
        title: "\u65B0\u8A02\u623F\u901A\u77E5",
        content: `\u6536\u5230\u65B0\u7684\u8A02\u623F\u7533\u8ACB
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${checkInDate.toLocaleDateString()}
\u9000\u623F\u65E5\u671F\uFF1A${checkOutDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${input.guestName}
\u806F\u7D61\u96FB\u8A71\uFF1A${input.guestPhone}`
      });
      return { id, success: true };
    }),
    checkAvailability: publicProcedure.input(z4.object({
      roomTypeId: z4.number(),
      checkInDate: z4.union([z4.date(), z4.string()]),
      checkOutDate: z4.union([z4.date(), z4.string()])
    })).query(async ({ input }) => {
      const parseDate = (dateInput) => {
        if (typeof dateInput === "string") {
          const parts = dateInput.split("-");
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          return new Date(year, month - 1, day);
        }
        return dateInput;
      };
      const checkInDate = parseDate(input.checkInDate);
      const checkOutDate = parseDate(input.checkOutDate);
      const isAvailable = await checkRoomAvailability(
        input.roomTypeId,
        checkInDate,
        checkOutDate
      );
      return { isAvailable };
    }),
    getById: adminProcedure4.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      const roomType = await getRoomTypeById(booking.roomTypeId);
      return {
        ...booking,
        roomTypeName: roomType?.name || "\u672A\u77E5\u623F\u578B",
        guests: booking.numberOfGuests
      };
    }),
    list: adminProcedure4.query(async () => {
      const bookings2 = await getAllBookings();
      return bookings2.map((booking) => ({
        ...booking,
        numberOfGuests: booking.numberOfGuests || 2
        // 預設值 2
      }));
    }),
    getByPhone: publicProcedure.input(z4.object({ phone: z4.string() })).query(async ({ input }) => {
      const bookings2 = await getBookingsByPhone(input.phone);
      const bookingsWithRoomName = await Promise.all(
        bookings2.map(async (booking) => {
          const roomType = await getRoomTypeById(booking.roomTypeId);
          return {
            ...booking,
            roomName: roomType?.name || "\u672A\u77E5\u623F\u578B"
          };
        })
      );
      return bookingsWithRoomName;
    }),
    cancel: publicProcedure.input(z4.object({
      id: z4.number(),
      phone: z4.string()
    })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      if (booking.guestPhone !== input.phone) {
        throw new TRPCError6({ code: "FORBIDDEN", message: "\u96FB\u8A71\u865F\u78BC\u4E0D\u5339\u914D" });
      }
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "\u53EA\u80FD\u53D6\u6D88\u5F85\u78BA\u8A8D\u6216\u5DF2\u78BA\u8A8D\u7684\u8A02\u55AE"
        });
      }
      await updateBookingStatus(input.id, "cancelled");
      if (booking.guestEmail) {
        const cancellationEmailHtml = generateBookingCancelledEmail(
          booking.guestName,
          booking.id
        );
        await sendEmail(
          booking.guestEmail,
          `\u8A02\u623F\u5DF2\u53D6\u6D88 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`,
          cancellationEmailHtml
        );
      }
      const roomType = await getRoomTypeById(booking.roomTypeId);
      await notifyOwner({
        title: "\u8A02\u55AE\u5DF2\u53D6\u6D88",
        content: `\u5BA2\u4EBA ${booking.guestName} \u5DF2\u53D6\u6D88\u8A02\u55AE
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}`
      });
      return { success: true };
    }),
    updateStatus: adminProcedure4.input(z4.object({
      id: z4.number(),
      status: z4.enum(["pending", "confirmed", "pending_payment", "paid", "completed", "cancelled"]),
      bankName: z4.string().optional(),
      accountNumber: z4.string().optional(),
      accountName: z4.string().optional()
    })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      await updateBookingStatus(input.id, input.status);
      const roomType = await getRoomTypeById(booking.roomTypeId);
      const guestEmail = booking.guestEmail;
      if (guestEmail) {
        let emailHtml = "";
        let emailSubject = "";
        switch (input.status) {
          case "confirmed":
            emailHtml = generateBookingConfirmedEmail(
              booking.guestName,
              booking.id,
              roomType?.name || "\u623F\u578B",
              booking.checkInDate,
              booking.checkOutDate,
              booking.totalPrice.toString()
            );
            emailSubject = `\u8A02\u623F\u5DF2\u78BA\u8A8D - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`;
            break;
          case "pending_payment":
            emailHtml = generatePaymentInstructionEmail(
              booking.guestName,
              booking.id,
              booking.totalPrice.toString(),
              input.bankName || "\u53F0\u7063\u9280\u884C",
              input.accountNumber || "123-456-789",
              input.accountName || "\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928"
            );
            emailSubject = `\u4ED8\u6B3E\u6307\u793A - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`;
            break;
          case "paid":
            emailHtml = generatePaymentConfirmedEmail(
              booking.guestName,
              booking.id,
              booking.totalPrice.toString(),
              booking.checkInDate
            );
            emailSubject = `\u4ED8\u6B3E\u5DF2\u78BA\u8A8D - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`;
            break;
          case "completed":
            emailHtml = generateBookingCompletedEmail(
              booking.guestName,
              booking.id,
              booking.checkOutDate
            );
            emailSubject = `\u8A02\u623F\u5DF2\u5B8C\u6210 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`;
            break;
          case "cancelled":
            emailHtml = generateBookingCancelledEmail(
              booking.guestName,
              booking.id
            );
            emailSubject = `\u8A02\u623F\u5DF2\u53D6\u6D88 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`;
            break;
        }
        if (emailHtml) {
          await sendEmail(guestEmail, emailSubject, emailHtml);
        }
      }
      const statusLabels = {
        confirmed: "\u5DF2\u78BA\u8A8D",
        pending_payment: "\u5F85\u4ED8\u6B3E",
        paid: "\u5DF2\u4ED8\u6B3E",
        completed: "\u5DF2\u5B8C\u6210",
        cancelled: "\u5DF2\u53D6\u6D88"
      };
      await notifyOwner({
        title: `\u8A02\u623F\u72C0\u614B\u8B8A\u66F4\uFF1A${statusLabels[input.status] || input.status}`,
        content: `\u8A02\u623F\u7DE8\u865F #${booking.id}
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${booking.checkInDate.toLocaleDateString("zh-TW")}
\u9000\u623F\u65E5\u671F\uFF1A${booking.checkOutDate.toLocaleDateString("zh-TW")}
\u8A02\u623F\u4EBA\uFF1A${booking.guestName}
\u65B0\u72C0\u614B\uFF1A${statusLabels[input.status] || input.status}`
      });
      return { success: true };
    }),
    // 删除訂單
    deleteBooking: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      await deleteBooking(input.id);
      return { success: true };
    }),
    // 快速操作：確認訂房
    confirmBooking: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await updateBookingStatus(input.id, "confirmed");
      const booking = await getBookingById(input.id);
      if (booking) {
        const roomType = await getRoomTypeById(booking.roomTypeId);
        await notifyOwner({
          title: "\u8A02\u623F\u5DF2\u78BA\u8A8D",
          content: `\u8A02\u623F\u5DF2\u78BA\u8A8D
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${booking.checkInDate.toLocaleDateString()}
\u9000\u623F\u65E5\u671F\uFF1A${booking.checkOutDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${booking.guestName}
\u806F\u7D61\u96FB\u8A71\uFF1A${booking.guestPhone}`
        });
      }
      return { success: true };
    }),
    // 選擇支付方式
    selectPaymentMethod: adminProcedure4.input(z4.object({
      id: z4.number(),
      method: z4.enum(["bank_transfer", "cash_on_site"])
    })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      console.log(`[selectPaymentMethod] \u8A02\u55AE #${input.id} \u7576\u524D\u72C0\u614B: ${booking.status}`);
      if (booking.status !== "confirmed") {
        throw new TRPCError6({ code: "BAD_REQUEST", message: `\u53EA\u6709\u5DF2\u78BA\u8A8D\u7684\u8A02\u55AE\u624D\u80FD\u9078\u64C7\u652F\u4ED8\u65B9\u5F0F\u3002\u7576\u524D\u72C0\u614B\uFF1A${booking.status}` });
      }
      const newStatus = input.method === "cash_on_site" ? "cash_on_site" : "pending_payment";
      console.log(`[selectPaymentMethod] \u66F4\u65B0\u8A02\u55AE #${input.id} \u72C0\u614B\u70BA: ${newStatus}`);
      await updateBookingStatus(input.id, newStatus);
      const updatedBooking = await getBookingById(input.id);
      console.log(`[selectPaymentMethod] \u8A02\u55AE #${input.id} \u66F4\u65B0\u5F8C\u72C0\u614B: ${updatedBooking?.status}`);
      if (updatedBooking) {
        const roomType = await getRoomTypeById(updatedBooking.roomTypeId);
        if (input.method === "cash_on_site") {
          await notifyOwner({
            title: "\u8A02\u623F\u5DF2\u78BA\u8A8D - \u73FE\u5834\u652F\u4ED8",
            content: `\u8A02\u623F\u5DF2\u78BA\u8A8D\uFF0C\u5BA2\u4EBA\u5C07\u65BC\u73FE\u5834\u652F\u4ED8
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${updatedBooking.checkInDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${updatedBooking.guestName}`
          });
        } else {
          await notifyOwner({
            title: "\u8A02\u623F\u5DF2\u78BA\u8A8D - \u5F85\u9280\u884C\u8F49\u5E33",
            content: `\u8A02\u623F\u5DF2\u78BA\u8A8D\uFF0C\u7B49\u5F85\u5BA2\u4EBA\u9280\u884C\u8F49\u5E33
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${updatedBooking.checkInDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${updatedBooking.guestName}
\u91D1\u984D\uFF1ANT${updatedBooking.totalPrice}`
          });
        }
      }
      return { success: true };
    }),
    // 確認銀行轉帳後五碼
    confirmBankTransfer: adminProcedure4.input(z4.object({
      id: z4.number(),
      lastFiveDigits: z4.string().regex(/^\d{5}$/)
    })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      if (booking.status !== "pending_payment") {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "\u53EA\u6709\u5F85\u4ED8\u6B3E\u7684\u8A02\u55AE\u624D\u80FD\u78BA\u8A8D\u9280\u884C\u8F49\u5E33" });
      }
      await updateBookingStatus(input.id, "paid");
      const updatedBooking = await getBookingById(input.id);
      if (updatedBooking) {
        const roomType = await getRoomTypeById(updatedBooking.roomTypeId);
        await notifyOwner({
          title: "\u8A02\u623F\u5DF2\u4ED8\u6B3E",
          content: `\u8A02\u623F\u5DF2\u6536\u5230\u9280\u884C\u8F49\u5E33
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${updatedBooking.checkInDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${updatedBooking.guestName}
\u91D1\u984D\uFF1ANT${updatedBooking.totalPrice}
\u5F8C\u4E94\u78BC\uFF1A${input.lastFiveDigits}`
        });
      }
      return { success: true };
    }),
    // 快速操作：標記入住
    markCheckedIn: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "\u8A02\u55AE\u4E0D\u5B58\u5728" });
      }
      if (booking.status !== "confirmed" && booking.status !== "paid" && booking.status !== "cash_on_site") {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "\u53EA\u6709\u5DF2\u78BA\u8A8D\u6216\u5DF2\u4ED8\u6B3E\u7684\u8A02\u55AE\u624D\u80FD\u6A19\u8A18\u5165\u4F4F" });
      }
      await updateBookingStatus(input.id, "completed");
      const updatedBooking = await getBookingById(input.id);
      if (updatedBooking) {
        const roomType = await getRoomTypeById(updatedBooking.roomTypeId);
        await notifyOwner({
          title: "\u5BA2\u4EBA\u5DF2\u5165\u4F4F",
          content: `\u5BA2\u4EBA\u5DF2\u8FA6\u7406\u5165\u4F4F
\u623F\u578B\uFF1A${roomType?.name}
\u5165\u4F4F\u65E5\u671F\uFF1A${updatedBooking.checkInDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${updatedBooking.guestName}`
        });
      }
      return { success: true };
    }),
    // 快速操作：發送郵件
    sendEmail: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Booking not found" });
      }
      if (!booking.guestEmail) {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "\u8A72\u8A02\u55AE\u6C92\u6709\u90F5\u4EF6\u5730\u5740" });
      }
      const roomType = await getRoomTypeById(booking.roomTypeId);
      const roomTypeName = roomType?.name || "\u672A\u77E5\u623F\u578B";
      await notifyOwner({
        title: "\u5DF2\u767C\u9001\u78BA\u8A8D\u90F5\u4EF6",
        content: `\u5DF2\u767C\u9001\u78BA\u8A8D\u90F5\u4EF6\u7D66\uFF1A${booking.guestEmail}
\u623F\u578B\uFF1A${roomTypeName}
\u623F\u50F9\uFF1ANT$${roomType?.price || 0}
\u5165\u4F4F\u65E5\u671F\uFF1A${booking.checkInDate.toLocaleDateString()}
\u9000\u623F\u65E5\u671F\uFF1A${booking.checkOutDate.toLocaleDateString()}
\u8A02\u623F\u4EBA\uFF1A${booking.guestName}
\u7E3D\u91D1\u984D\uFF1ANT$${booking.totalPrice}`
      });
      return { success: true, message: "\u90F5\u4EF6\u5DF2\u767C\u9001" };
    }),
    reconciliationReport: publicProcedure.input(z4.object({
      startDate: z4.string().optional(),
      endDate: z4.string().optional()
    })).query(async ({ input }) => {
      const start = input.startDate ? new Date(input.startDate) : new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() - 30));
      const end = input.endDate ? new Date(input.endDate) : /* @__PURE__ */ new Date();
      const bookings2 = await getAllBookings();
      const filteredBookings = bookings2.filter((b) => {
        const checkInDate = new Date(b.checkInDate);
        return checkInDate >= start && checkInDate <= end;
      });
      const byStatus = {
        pending: filteredBookings.filter((b) => b.status === "pending"),
        confirmed: filteredBookings.filter((b) => b.status === "confirmed"),
        pending_payment: filteredBookings.filter((b) => b.status === "pending_payment"),
        paid: filteredBookings.filter((b) => b.status === "paid"),
        completed: filteredBookings.filter((b) => b.status === "completed"),
        cancelled: filteredBookings.filter((b) => b.status === "cancelled")
      };
      const stats = {
        total: filteredBookings.length,
        totalAmount: filteredBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice || "0"), 0),
        pending: byStatus.pending.length,
        confirmed: byStatus.confirmed.length,
        pending_payment: byStatus.pending_payment.length,
        paid: byStatus.paid.length,
        completed: byStatus.completed.length,
        cancelled: byStatus.cancelled.length,
        paidAmount: byStatus.paid.reduce((sum, b) => sum + parseFloat(b.totalPrice || "0"), 0),
        unpaidAmount: [...byStatus.pending, ...byStatus.confirmed, ...byStatus.pending_payment].reduce((sum, b) => sum + parseFloat(b.totalPrice || "0"), 0)
      };
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        stats,
        bookings: filteredBookings,
        byStatus
      };
    })
  }),
  // News
  news: router({
    list: publicProcedure.query(async () => {
      return await getAllNews();
    }),
    getById: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
      const newsItem = await getNewsById(input.id);
      if (!newsItem) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "News not found" });
      }
      return newsItem;
    }),
    create: adminProcedure4.input(z4.object({
      title: z4.string(),
      titleEn: z4.string().optional(),
      content: z4.string(),
      contentEn: z4.string().optional(),
      type: z4.enum(["announcement", "promotion", "event"]).default("announcement"),
      coverImage: z4.string().optional(),
      image: z4.string().optional(),
      isPublished: z4.boolean().default(true)
    })).mutation(async ({ input }) => {
      const id = await createNews(input);
      return { id, success: true };
    }),
    update: adminProcedure4.input(z4.object({
      id: z4.number(),
      title: z4.string().optional(),
      titleEn: z4.string().optional(),
      content: z4.string().optional(),
      image: z4.string().optional(),
      contentEn: z4.string().optional(),
      type: z4.enum(["announcement", "promotion", "event"]).optional(),
      coverImage: z4.string().optional(),
      isPublished: z4.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateNews(id, data);
      return { success: true };
    }),
    delete: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await deleteNews(input.id);
      return { success: true };
    })
  }),
  // Facilities
  facilities: router({
    list: publicProcedure.query(async () => {
      return await getAllFacilities();
    }),
    create: adminProcedure4.input(z4.object({
      name: z4.string(),
      nameEn: z4.string().optional(),
      description: z4.string(),
      descriptionEn: z4.string().optional(),
      icon: z4.string().optional(),
      images: z4.string().optional(),
      displayOrder: z4.number().default(0)
    })).mutation(async ({ input }) => {
      const id = await createFacility(input);
      return { id, success: true };
    }),
    update: adminProcedure4.input(z4.object({
      id: z4.number(),
      name: z4.string().optional(),
      nameEn: z4.string().optional(),
      description: z4.string().optional(),
      descriptionEn: z4.string().optional(),
      icon: z4.string().optional(),
      images: z4.string().optional(),
      isActive: z4.boolean().optional(),
      displayOrder: z4.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateFacility(id, data);
      return { success: true };
    })
  }),
  // AI Chat
  chat: router({
    ask: publicProcedure.input(z4.object({
      message: z4.string(),
      history: z4.array(z4.object({
        role: z4.enum(["user", "assistant"]),
        content: z4.string()
      })).optional()
    })).mutation(async ({ input }) => {
      try {
        const rooms = await getAllRoomTypes();
        const facilities2 = await getAllFacilities();
        const roomsContext = rooms.map((r) => `${r.name}: NT$${r.price}/\u665A, \u5BB9\u7D0D${r.capacity}\u4EBA`).join("\n");
        const facilitiesContext = facilities2.map((f) => f.name).join(", ");
        const systemPrompt = `\u4F60\u662F\u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u7684 AI \u5BA2\u670D\u52A9\u624B\u3002\u65C5\u9928\u4F4D\u65BC\u53F0\u5357\u5E02\u65B0\u71DF\u5340\u9577\u69AE\u8DEF\u4E00\u6BB541\u865F\uFF0C\u96FB\u8A7106-635-9577\u3002

\u53EF\u7528\u623F\u578B\uFF1A
${roomsContext}

\u8A2D\u65BD\uFF1A${facilitiesContext}

\u8ACB\u7528\u7E41\u9AD4\u4E2D\u6587\u56DE\u7B54\u8A2A\u5BA2\u7684\u554F\u984C\u3002\u5982\u679C\u554F\u984C\u8D85\u51FA\u7BC4\u570D\uFF0C\u8ACB\u79AE\u8C8C\u5730\u5EFA\u8B70\u8A2A\u5BA2\u806F\u7D61\u65C5\u9928\u3002`;
        const messages = [
          { role: "system", content: systemPrompt },
          ...input.history || [],
          { role: "user", content: input.message }
        ];
        const response = await invokeLLM({ messages });
        const reply = response.choices[0]?.message?.content || "\u62B1\u6B49\uFF0C\u6211\u7121\u6CD5\u56DE\u7B54\u60A8\u7684\u554F\u984C\u3002";
        return { reply };
      } catch (error) {
        console.error("Chat error:", error);
        throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Chat service unavailable" });
      }
    })
  }),
  // Room Availability Management
  roomAvailability: router({
    // Check availability for booking
    checkAvailability: publicProcedure.input(z4.object({
      roomTypeId: z4.number(),
      checkInDate: z4.string(),
      checkOutDate: z4.string()
    })).query(async ({ input }) => {
      const checkIn = new Date(input.checkInDate);
      const checkOut = new Date(input.checkOutDate);
      const isAvailable = await checkRoomAvailability(
        input.roomTypeId,
        checkIn,
        checkOut
      );
      const roomType = await getRoomTypeById(input.roomTypeId);
      const maxQuantity = roomType?.maxSalesQuantity || 10;
      const bookings2 = await getBookingsByRoomAndDateRange(
        input.roomTypeId,
        checkIn,
        checkOut
      );
      const bookedCount = bookings2.filter(
        (b) => b.status !== "cancelled"
      ).length;
      const available = Math.max(0, maxQuantity - bookedCount);
      return {
        isAvailable: available > 0,
        available,
        maxQuantity,
        bookedCount
      };
    }),
    // Get availability for a specific room type and date range
    getByRoomAndDateRange: publicProcedure.input(z4.object({
      roomTypeId: z4.number(),
      startDate: z4.date(),
      endDate: z4.date()
    })).query(async ({ input }) => {
      return await getRoomAvailabilityByDateRange(
        input.roomTypeId,
        input.startDate,
        input.endDate
      );
    }),
    // Set availability for specific dates (batch operation)
    setAvailability: adminProcedure4.input(z4.object({
      roomTypeId: z4.number(),
      dates: z4.array(z4.date()),
      isAvailable: z4.boolean(),
      reason: z4.string().optional()
    })).mutation(async ({ input }) => {
      await setRoomAvailability(
        input.roomTypeId,
        input.dates,
        input.isAvailable,
        input.reason
      );
      return { success: true };
    }),
    // Get all unavailable dates for a room type (for calendar display)
    getUnavailableDates: publicProcedure.input(z4.object({
      roomTypeId: z4.number()
    })).query(async ({ input }) => {
      return await getUnavailableDates(input.roomTypeId);
    }),
    updateMaxSalesQuantity: adminProcedure4.input(z4.object({
      roomTypeId: z4.number(),
      date: z4.date(),
      maxSalesQuantity: z4.number().min(0).max(100)
    })).mutation(async ({ input }) => {
      await updateMaxSalesQuantity(
        input.roomTypeId,
        input.date,
        input.maxSalesQuantity
      );
      return { success: true };
    }),
    updateDynamicPrice: adminProcedure4.input(z4.object({
      roomTypeId: z4.number(),
      date: z4.date(),
      weekdayPrice: z4.number().positive().optional(),
      weekendPrice: z4.number().positive().optional()
    })).mutation(async ({ input }) => {
      await updateDynamicPrice(
        input.roomTypeId,
        input.date,
        input.weekdayPrice,
        input.weekendPrice
      );
      return { success: true };
    })
  }),
  // Home Config
  homeConfig: router({
    get: publicProcedure.query(async () => {
      return await getHomeConfig();
    }),
    update: adminProcedure4.input(z4.object({
      carouselImages: z4.string().optional(),
      vipGarageImage: z4.string().optional(),
      deluxeRoomImage: z4.string().optional(),
      facilitiesImage: z4.string().optional()
    })).mutation(async ({ input }) => {
      await updateHomeConfig(input);
      return { success: true };
    })
  }),
  // Contact Messages
  contact: router({
    send: publicProcedure.input(z4.object({
      name: z4.string(),
      email: z4.string().email(),
      phone: z4.string().optional(),
      subject: z4.string().optional(),
      message: z4.string()
    })).mutation(async ({ input }) => {
      const id = await createContactMessage(input);
      await notifyOwner({
        title: "\u65B0\u806F\u7D61\u8A0A\u606F",
        content: `\u6536\u5230\u65B0\u7684\u806F\u7D61\u8A0A\u606F
\u59D3\u540D\uFF1A${input.name}
Email\uFF1A${input.email}
\u4E3B\u65E8\uFF1A${input.subject || "\u7121"}
\u8A0A\u606F\uFF1A${input.message}`
      });
      return { id, success: true };
    }),
    list: adminProcedure4.query(async () => {
      return await getAllContactMessages();
    }),
    markAsRead: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await markMessageAsRead(input.id);
      return { success: true };
    })
  }),
  // Featured Services Management
  featuredServices: router({
    list: publicProcedure.query(async () => {
      return await getAllFeaturedServices();
    }),
    getById: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
      const service = await getFeaturedServiceById(input.id);
      if (!service) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Featured service not found" });
      }
      return service;
    }),
    create: adminProcedure4.input(z4.object({
      title: z4.string(),
      titleEn: z4.string().optional(),
      description: z4.string(),
      descriptionEn: z4.string().optional(),
      image: z4.string().optional(),
      displayOrder: z4.number().default(0),
      isActive: z4.boolean().default(true)
    })).mutation(async ({ input }) => {
      const service = await createFeaturedService(input);
      if (!service) {
        throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create featured service" });
      }
      return service;
    }),
    update: adminProcedure4.input(z4.object({
      id: z4.number(),
      title: z4.string().optional(),
      titleEn: z4.string().optional(),
      description: z4.string().optional(),
      descriptionEn: z4.string().optional(),
      image: z4.string().optional(),
      displayOrder: z4.number().optional(),
      isActive: z4.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateFeaturedService(id, data);
      return { success: true };
    }),
    delete: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await deleteFeaturedService(input.id);
      return { success: true };
    })
  }),
  accounts: router({
    list: adminProcedure4.query(async () => {
      return await getAllUsers();
    }),
    create: adminProcedure4.input(z4.object({
      username: z4.string().min(3).max(64),
      name: z4.string().min(1).max(100),
      role: z4.enum(["user", "admin"]),
      password: z4.string().min(6).max(128)
    })).mutation(async ({ input }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) {
        throw new TRPCError6({ code: "CONFLICT", message: "Username already exists" });
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      await upsertUser({
        username: input.username,
        name: input.name,
        role: input.role,
        passwordHash,
        loginMethod: "username",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      return { success: true };
    }),
    update: adminProcedure4.input(z4.object({
      id: z4.number(),
      name: z4.string().optional(),
      role: z4.enum(["user", "admin"]).optional(),
      password: z4.string().min(6).max(128).optional()
    })).mutation(async ({ input }) => {
      const { id, password, ...data } = input;
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        await updateUser(id, { ...data, passwordHash });
      } else {
        await updateUser(id, data);
      }
      return { success: true };
    }),
    delete: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { success: true };
    }),
    toggleStatus: adminProcedure4.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
      const allUsers = await getAllUsers();
      const user = allUsers.find((u) => u.id === input.id);
      if (!user) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "User not found" });
      }
      const newStatus = user.status === "active" ? "inactive" : "active";
      await updateUser(input.id, { status: newStatus });
      return { success: true, status: newStatus };
    })
  }),
  // 房間控管系統 - iCal同步用
  roomBlockage: router({
    // 添加房間關閉日期
    blockDates: adminProcedure4.input(z4.object({
      roomTypeId: z4.number(),
      dates: z4.array(z4.date()),
      reason: z4.string().optional()
    })).mutation(async ({ input }) => {
      const blockageId = await createRoomBlockage(input.roomTypeId, input.dates, input.reason);
      return { success: true, message: `\u5DF2\u95DC\u9589\u623F\u578B ${input.roomTypeId} \u7684 ${input.dates.length} \u500B\u65E5\u671F`, blockageId };
    }),
    // 移除房間關閉日期
    unblockDates: adminProcedure4.input(z4.object({
      roomTypeId: z4.number(),
      dates: z4.array(z4.date())
    })).mutation(async ({ input }) => {
      await deleteRoomBlockage(input.roomTypeId, input.dates);
      return { success: true, message: `\u5DF2\u958B\u555F\u623F\u578B ${input.roomTypeId} \u7684 ${input.dates.length} \u500B\u65E5\u671F` };
    }),
    // 取得房間關閉狀態
    getBlockedDates: publicProcedure.input(z4.object({ roomTypeId: z4.number() })).query(async ({ input }) => {
      const blockedDates = await getBlockedDatesInRange(input.roomTypeId, /* @__PURE__ */ new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3));
      return blockedDates;
    }),
    // 批量檢查日期是否被關閉
    checkBlockedDates: publicProcedure.input(z4.object({
      roomTypeId: z4.number(),
      dates: z4.array(z4.date())
    })).query(async ({ input }) => {
      const blockedDates = [];
      for (const date of input.dates) {
        const isBlocked = await isDateBlocked(input.roomTypeId, date);
        if (isBlocked) {
          blockedDates.push(date);
        }
      }
      return blockedDates;
    })
  }),
  // 儀表板數據
  dashboard: router({
    getStats: protectedProcedure.query(async () => {
      try {
        const allBookings = await getAllBookings();
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayCheckIns = allBookings.filter((b) => {
          const checkInDate = new Date(b.checkInDate);
          checkInDate.setHours(0, 0, 0, 0);
          return checkInDate.getTime() === today.getTime() && b.status === "confirmed";
        }).length;
        const pendingBookings = allBookings.filter((b) => b.status === "pending").length;
        const confirmedBookings = allBookings.filter((b) => b.status === "confirmed").length;
        const monthStart = /* @__PURE__ */ new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        const monthRevenue = allBookings.filter((b) => {
          const createdDate = new Date(b.createdAt);
          return createdDate >= monthStart && createdDate < monthEnd && b.status === "confirmed";
        }).reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        return {
          todayCheckIns,
          pendingBookings,
          confirmedBookings,
          monthRevenue: Math.round(monthRevenue)
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          todayCheckIns: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          monthRevenue: 0
        };
      }
    })
  }),
  // Booking.com iCal 同步
  iCalSync: router({
    // 手動触發同步
    syncNow: adminProcedure4.mutation(async () => {
      return await manualSyncBookingCalendar();
    }),
    // 启動自動同步
    start: adminProcedure4.mutation(async () => {
      startBookingCalendarSync();
      return { success: true, message: "iCal \u540C\u6B65\u5DF2\u555F\u52D5" };
    }),
    // 停止自動同步
    stop: adminProcedure4.mutation(async () => {
      stopBookingCalendarSync();
      return { success: true, message: "iCal \u540C\u6B65\u5DF2\u505C\u6B62" };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    try {
      const token = opts.req.cookies[COOKIE_NAME];
      console.log(`[AUTH] Cookie name: ${COOKIE_NAME}, Token exists: ${!!token}`);
      if (token) {
        const payload = verify(token);
        console.log(`[AUTH] JWT verified successfully for user: ${payload.username}`);
        user = {
          id: payload.id,
          openId: `local-${payload.username || payload.id}`,
          username: payload.username || null,
          name: payload.name || null,
          email: null,
          role: payload.role || "user",
          loginMethod: "local",
          lastSignedIn: /* @__PURE__ */ new Date(),
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      } else {
        console.log(`[AUTH] No token found in cookies`);
      }
    } catch (jwtError) {
      console.log(`[AUTH] JWT verification failed:`, jwtError instanceof Error ? jwtError.message : jwtError);
      user = null;
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
init_websocket();

// server/schedulers/reminder-scheduler.ts
import cron from "node-cron";
function generatePendingConfirmationReminder(guestName, bookingId, checkInDate) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .reminder-box { background-color: #fff3e0; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0; border-radius: 4px; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u23F0 \u8A02\u623F\u78BA\u8A8D\u63D0\u9192</h1>
          <p>\u60A8\u6709\u5F85\u78BA\u8A8D\u7684\u8A02\u623F</p>
        </div>
        
        <div class="content">
          <p>\u89AA\u611B\u7684 ${guestName} \u60A8\u597D\uFF0C</p>
          <p>\u6211\u5011\u6536\u5230\u60A8\u7684\u8A02\u623F\u7533\u8ACB\uFF0C\u4F46\u5C1A\u672A\u6536\u5230\u60A8\u7684\u78BA\u8A8D\u3002\u8ACB\u76E1\u5FEB\u78BA\u8A8D\u60A8\u7684\u8A02\u623F\u3002</p>
          
          <div class="reminder-box">
            <p><strong>\u8A02\u623F\u7DE8\u865F\uFF1A</strong>#${bookingId}</p>
            <p><strong>\u5165\u4F4F\u65E5\u671F\uFF1A</strong>${checkInDate.toLocaleDateString("zh-TW")}</p>
            <p><strong>\u72C0\u614B\uFF1A</strong>\u5F85\u78BA\u8A8D</p>
          </div>
          
          <p>\u8ACB\u9EDE\u64CA\u4E0B\u65B9\u9023\u7D50\u78BA\u8A8D\u60A8\u7684\u8A02\u623F\uFF1A</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://european-castle-hotel.manus.space/booking-tracking?bookingId=${bookingId}" style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">\u78BA\u8A8D\u8A02\u623F</a>
          </p>
          
          <div class="footer">
            <p>\xA9 2026 \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8<br>\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u76F4\u63A5\u56DE\u8986\u3002</p>
          </div>
        </div>
      </div>
    </html>
  `;
}
function generatePaymentReminderEmail(guestName, bookingId, totalPrice) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .payment-box { background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0; border-radius: 4px; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u{1F4B3} \u4ED8\u6B3E\u63D0\u9192</h1>
          <p>\u60A8\u6709\u5F85\u4ED8\u6B3E\u7684\u8A02\u623F</p>
        </div>
        
        <div class="content">
          <p>\u89AA\u611B\u7684 ${guestName} \u60A8\u597D\uFF0C</p>
          <p>\u60A8\u7684\u8A02\u623F\u5DF2\u78BA\u8A8D\uFF0C\u8ACB\u76E1\u5FEB\u5B8C\u6210\u4ED8\u6B3E\u3002</p>
          
          <div class="payment-box">
            <p><strong>\u8A02\u623F\u7DE8\u865F\uFF1A</strong>#${bookingId}</p>
            <p><strong>\u61C9\u4ED8\u91D1\u984D\uFF1A</strong>${totalPrice}</p>
            <p><strong>\u72C0\u614B\uFF1A</strong>\u5F85\u4ED8\u6B3E</p>
          </div>
          
          <p>\u8ACB\u9EDE\u64CA\u4E0B\u65B9\u9023\u7D50\u67E5\u770B\u4ED8\u6B3E\u8A73\u60C5\u4E26\u63D0\u4EA4\u8F49\u5E33\u5F8C\u4E94\u78BC\uFF1A</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://european-castle-hotel.manus.space/booking-tracking?bookingId=${bookingId}" style="background-color: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">\u63D0\u4EA4\u4ED8\u6B3E</a>
          </p>
          
          <div class="footer">
            <p>\xA9 2026 \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8<br>\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u76F4\u63A5\u56DE\u8986\u3002</p>
          </div>
        </div>
      </div>
    </html>
  `;
}
function scheduleConfirmationReminders() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] \u57F7\u884C\u5F85\u78BA\u8A8D\u8A02\u623F\u63D0\u9192\u4EFB\u52D9...");
    try {
      const pendingBookings = await getAllBookings();
      const confirmationPending = pendingBookings.filter((b) => b.status === "pending");
      for (const booking of confirmationPending) {
        if (booking.guestEmail) {
          const emailHtml = generatePendingConfirmationReminder(
            booking.guestName,
            booking.id,
            booking.checkInDate
          );
          await sendEmail(
            booking.guestEmail,
            `\u8A02\u623F\u78BA\u8A8D\u63D0\u9192 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`,
            emailHtml
          );
        }
      }
      console.log(`[Scheduler] \u2705 \u5DF2\u767C\u9001 ${confirmationPending.length} \u5C01\u5F85\u78BA\u8A8D\u63D0\u9192\u90F5\u4EF6`);
    } catch (error) {
      console.error("[Scheduler] \u274C \u5F85\u78BA\u8A8D\u63D0\u9192\u4EFB\u52D9\u5931\u6557:", error);
    }
  });
}
function schedulePaymentReminders() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] \u57F7\u884C\u5F85\u4ED8\u6B3E\u8A02\u623F\u63D0\u9192\u4EFB\u52D9...");
    try {
      const allBookings = await getAllBookings();
      const paymentPending = allBookings.filter((b) => b.status === "pending_payment");
      for (const booking of paymentPending) {
        if (booking.guestEmail) {
          const emailHtml = generatePaymentReminderEmail(
            booking.guestName,
            booking.id,
            booking.totalPrice
          );
          await sendEmail(
            booking.guestEmail,
            `\u4ED8\u6B3E\u63D0\u9192 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`,
            emailHtml
          );
        }
      }
      console.log(`[Scheduler] \u2705 \u5DF2\u767C\u9001 ${paymentPending.length} \u5C01\u5F85\u4ED8\u6B3E\u63D0\u9192\u90F5\u4EF6`);
    } catch (error) {
      console.error("[Scheduler] \u274C \u5F85\u4ED8\u6B3E\u63D0\u9192\u4EFB\u52D9\u5931\u6557:", error);
    }
  });
}
function scheduleCheckInReminders() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] \u57F7\u884C\u5165\u4F4F\u63D0\u9192\u4EFB\u52D9...");
    try {
      const allBookings = await getAllBookings();
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const checkInTomorrow = allBookings.filter((b) => {
        const checkInDate = new Date(b.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate.getTime() === tomorrow.getTime() && b.status === "paid";
      });
      for (const booking of checkInTomorrow) {
        if (booking.guestEmail) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
                .checkin-box { background-color: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0; border-radius: 4px; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 4px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>\u{1F3E8} \u5165\u4F4F\u63D0\u9192</h1>
                  <p>\u60A8\u5373\u5C07\u5165\u4F4F\u6211\u5011\u7684\u65C5\u9928</p>
                </div>
                
                <div class="content">
                  <p>\u89AA\u611B\u7684 ${booking.guestName} \u60A8\u597D\uFF0C</p>
                  <p>\u60A8\u7684\u8A02\u623F\u5373\u5C07\u5728\u660E\u5929\u5165\u4F4F\u3002\u8ACB\u6E96\u6642\u5230\u9054\uFF0C\u6211\u5011\u5DF2\u70BA\u60A8\u6E96\u5099\u597D\u623F\u9593\u3002</p>
                  
                  <div class="checkin-box">
                    <p><strong>\u8A02\u623F\u7DE8\u865F\uFF1A</strong>#${booking.id}</p>
                    <p><strong>\u5165\u4F4F\u65E5\u671F\uFF1A</strong>${new Date(booking.checkInDate).toLocaleDateString("zh-TW")}</p>
                    <p><strong>\u9810\u8A08\u5165\u4F4F\u6642\u9593\uFF1A</strong>\u4E0B\u5348 3:00 \u8D77</p>
                  </div>
                  
                  <p>\u5982\u6709\u4EFB\u4F55\u554F\u984C\uFF0C\u6B61\u8FCE\u96A8\u6642\u806F\u7D61\u6211\u5011\u3002</p>
                  
                  <div class="footer">
                    <p>\xA9 2026 \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928\u6709\u9650\u516C\u53F8<br>\u6B64\u90F5\u4EF6\u7531\u7CFB\u7D71\u81EA\u52D5\u767C\u9001\uFF0C\u8ACB\u52FF\u76F4\u63A5\u56DE\u8986\u3002</p>
                  </div>
                </div>
              </div>
            </html>
          `;
          await sendEmail(
            booking.guestEmail,
            `\u5165\u4F4F\u63D0\u9192 - \u6B50\u5821\u5546\u52D9\u6C7D\u8ECA\u65C5\u9928 (\u8A02\u623F\u7DE8\u865F: #${booking.id})`,
            emailHtml
          );
        }
      }
      console.log(`[Scheduler] \u2705 \u5DF2\u767C\u9001 ${checkInTomorrow.length} \u5C01\u5165\u4F4F\u63D0\u9192\u90F5\u4EF6`);
    } catch (error) {
      console.error("[Scheduler] \u274C \u5165\u4F4F\u63D0\u9192\u4EFB\u52D9\u5931\u6557:", error);
    }
  });
}
function initializeSchedulers() {
  console.log("[Scheduler] \u521D\u59CB\u5316\u81EA\u52D5\u63D0\u9192\u8ABF\u5EA6\u5668...");
  console.log("[Scheduler] \u23F0 \u8A2D\u7F6E\u6BCF\u65E5 09:00 \u57F7\u884C\u6240\u6709\u81EA\u52D5\u63D0\u9192\u4EFB\u52D9");
  scheduleConfirmationReminders();
  schedulePaymentReminders();
  scheduleCheckInReminders();
  console.log("[Scheduler] \u2705 \u8ABF\u5EA6\u5668\u5DF2\u521D\u59CB\u5316\u5B8C\u6210");
}

// server/_core/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
function initializeCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}
async function uploadToCloudinary(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: `hotel-rooms/${Date.now()}-${filename.replace(/\s+/g, "-")}`,
        folder: "hotel-rooms"
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] Upload error:", error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          console.log(`[Cloudinary] Upload successful: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        } else {
          reject(new Error("Cloudinary upload failed: No result"));
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// server/_core/upload.ts
async function handleUpload(req, res) {
  try {
    initializeCloudinary();
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided"
      });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("[Upload] Cloudinary credentials not configured");
      return res.status(500).json({
        success: false,
        error: "Cloudinary credentials not configured"
      });
    }
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
      });
    }
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: "File size exceeds 10MB limit"
      });
    }
    console.log(`[Upload] Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    console.log(`[Upload] Successfully uploaded to Cloudinary: ${result.url}`);
    return res.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        filename: req.file.originalname
      }
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Upload failed"
    });
  }
}

// server/_core/index.ts
import bcrypt3 from "bcrypt";

// server/_core/init-api.ts
import bcrypt2 from "bcrypt";
import { eq as eq3 } from "drizzle-orm";
async function registerInitRoutes(app) {
  app.post("/api/init-admin", async (req, res) => {
    try {
      console.log("[Init] Received init-admin request");
      const db = await getDb();
      if (!db) {
        console.error("[Init] Database not connected");
        return res.status(500).json({
          success: false,
          error: "Database connection failed",
          message: "Unable to connect to database. Please check DATABASE_URL environment variable."
        });
      }
      console.log("[Init] Database connected, checking for existing admin");
      const existingAdmin = await db.select().from(users).where(eq3(users.username, "admin")).limit(1);
      if (existingAdmin.length > 0) {
        console.log("[Init] Admin account already exists");
        return res.json({
          success: true,
          message: "Admin account already exists",
          user: {
            id: existingAdmin[0].id,
            username: existingAdmin[0].username,
            name: existingAdmin[0].name
          }
        });
      }
      console.log("[Init] Creating new admin account");
      const passwordHash = await bcrypt2.hash("123456", 10);
      const result = await db.insert(users).values({
        username: "admin",
        passwordHash,
        name: "\u7BA1\u7406\u54E1",
        role: "admin",
        loginMethod: "password",
        status: "active"
      });
      console.log("[Init] Admin account created successfully");
      res.json({
        success: true,
        message: "Admin account created successfully",
        credentials: {
          username: "admin",
          password: "123456"
        },
        warning: "Please change the password after first login!"
      });
    } catch (error) {
      console.error("[Init] Error:", error);
      res.status(500).json({
        success: false,
        error: "Initialization failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app.get("/api/health/db", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({
          status: "disconnected",
          message: "Database connection failed"
        });
      }
      const result = await db.select().from(users).limit(1);
      res.json({
        status: "connected",
        message: "Database connection successful",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("[Health] Database error:", error);
      res.status(503).json({
        status: "error",
        message: "Database query failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/status", (req, res) => {
    res.json({
      env: process.env.NODE_ENV || "development",
      db: "check_pending",
      version: "Production-v2.1",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
    // 5MB
  });
  app.post("/api/upload", upload.single("file"), handleUpload);
  registerOAuthRoutes(app);
  registerInitRoutes(app);
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
      }
      const db = await getDb();
      if (!db) {
        console.error("[Login] Database not connected");
        return res.status(500).json({ error: "Database connection failed" });
      }
      const user = await db.query.users.findFirst({
        where: (users2, { eq: eq4 }) => eq4(users2.username, username)
      });
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const isPasswordValid = await bcrypt3.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const token = sign({ userId: user.id, username: user.username, role: user.role });
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("[Login] Error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  wsManager.initialize(server);
  initializeSchedulers();
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[Scheduler] \u81EA\u52D5\u63D0\u9192\u8ABF\u5EA6\u5668\u5DF2\u555F\u52D5`);
  });
}
// 全域錯誤捕捉 - 用於診斷 Vercel 環境的 500 錯誤
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Global Error] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Global Error] Uncaught Exception:', error);
});

startServer().catch((error) => {
  console.error('[StartServer] Fatal Error:', error);
  if (error instanceof Error) {
    console.error('[StartServer] Error Message:', error.message);
    console.error('[StartServer] Error Stack:', error.stack);
  }
});
