import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Room types table - stores different room categories
 */
export const roomTypes = mysqlTable("room_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  description: text("description").notNull(),
  descriptionEn: text("descriptionEn"),
  size: varchar("size", { length: 50 }), // e.g., "30坪"
  capacity: int("capacity").notNull().default(2), // number of guests
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weekendPrice: decimal("weekendPrice", { precision: 10, scale: 2 }),
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
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
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
