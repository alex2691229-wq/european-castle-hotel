import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Optional for backward compatibility
  username: varchar("username", { length: 64 }).unique(), // Optional for username/password auth
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("oauth"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Room types table - stores different room categories
 * Note: This table has mixed column naming (camelCase + snake_case)
 */
export const roomTypes = mysqlTable("room_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  size: varchar("size", { length: 50 }), // e.g., "30坪"
  capacity: int("capacity").notNull().default(2), // number of guests
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weekendPrice: decimal("weekend_price", { precision: 10, scale: 2 }),
  maxSalesQuantity: int("max_sales_quantity").default(10).notNull(), // maximum number of rooms that can be sold per day
  images: text("images"), // JSON array of image URLs
  amenities: text("amenities"), // JSON array of amenities
  isAvailable: boolean("isAvailable").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoomType = typeof roomTypes.$inferSelect;
export type InsertRoomType = typeof roomTypes.$inferInsert;

/**
 * Bookings table - stores reservation information
 */
export const bookings = mysqlTable("bookings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * News/Announcements table
 */
export const news = mysqlTable("news", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * Facilities table - hotel amenities and services
 */
export const facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("descriptionEn"),
  icon: varchar("icon", { length: 50 }), // lucide icon name
  images: text("images"), // JSON array of image URLs
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

/**
 * Contact messages table
 */
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Room availability table - stores which dates are available for booking
 */
export const roomAvailability = mysqlTable("room_availability", {
  id: int("id").autoincrement().primaryKey(),
  roomTypeId: int("roomTypeId").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  maxSalesQuantity: int("maxSalesQuantity").default(10).notNull(), // maximum number of rooms that can be sold on this date
  bookedQuantity: int("bookedQuantity").default(0).notNull(), // number of rooms already booked
  weekdayPrice: decimal("weekdayPrice", { precision: 10, scale: 2 }), // override price for this date (weekday)
  weekendPrice: decimal("weekendPrice", { precision: 10, scale: 2 }), // override price for this date (weekend)
  isHolidayOverride: boolean("isHolidayOverride"), // null = auto-detect, true = force holiday, false = force weekday
  reason: varchar("reason", { length: 200 }), // optional reason for unavailability
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoomAvailability = typeof roomAvailability.$inferSelect;
export type InsertRoomAvailability = typeof roomAvailability.$inferInsert;

/**
 * Home page configuration table - stores carousel and feature images
 */
export const homeConfig = mysqlTable("home_config", {
  id: int("id").autoincrement().primaryKey(),
  carouselImages: text("carouselImages"), // JSON array of carousel image URLs
  vipGarageImage: varchar("vipGarageImage", { length: 500 }),
  deluxeRoomImage: varchar("deluxeRoomImage", { length: 500 }),
  facilitiesImage: varchar("facilitiesImage", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomeConfig = typeof homeConfig.$inferSelect;
export type InsertHomeConfig = typeof homeConfig.$inferInsert;


/**
 * Featured services configuration table - stores featured services with images and descriptions
 */
export const featuredServices = mysqlTable("featured_services", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  titleEn: varchar("titleEn", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("descriptionEn"),
  image: varchar("image", { length: 500 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeaturedService = typeof featuredServices.$inferSelect;
export type InsertFeaturedService = typeof featuredServices.$inferInsert;

/**
 * Payment details table - stores payment information for bookings
 */
export const paymentDetails = mysqlTable("payment_details", {
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
  transferReference: varchar("transferReference", { length: 100 }), // transfer memo/reference number
  transferDate: timestamp("transferDate"), // when the transfer was made
  lastFiveDigits: varchar("lastFiveDigits", { length: 5 }), // last 5 digits of transfer for verification
  // Payment confirmation
  confirmedAt: timestamp("confirmedAt"), // when payment was confirmed
  confirmedBy: int("confirmedBy"), // admin user who confirmed the payment
  notes: text("notes"), // additional notes about the payment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentDetail = typeof paymentDetails.$inferSelect;
export type InsertPaymentDetail = typeof paymentDetails.$inferInsert;
