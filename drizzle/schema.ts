import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(), // Optional for backward compatibility
  username: varchar("username", { length: 64 }).unique(), // Optional for username/password auth
  passwordHash: varchar("password_hash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }).default("oauth"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Room types table - stores different room categories
 */
export const roomTypes = mysqlTable("room_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  size: varchar("size", { length: 50 }), // e.g., "30坪"
  capacity: int("capacity").notNull().default(2), // number of guests
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weekendPrice: decimal("weekend_price", { precision: 10, scale: 2 }),
  maxSalesQuantity: int("max_sales_quantity").default(10).notNull(), // maximum number of rooms that can be sold per day
  images: text("images"), // JSON array of image URLs
  amenities: text("amenities"), // JSON array of amenities
  isAvailable: boolean("is_available").default(true).notNull(),
  displayOrder: int("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RoomType = typeof roomTypes.$inferSelect;
export type InsertRoomType = typeof roomTypes.$inferInsert;

/**
 * Bookings table - stores reservation information
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  roomTypeId: int("room_type_id").notNull(),
  userId: int("user_id"),
  guestName: varchar("guest_name", { length: 100 }).notNull(),
  guestEmail: varchar("guest_email", { length: 320 }),
  guestPhone: varchar("guest_phone", { length: 20 }).notNull(),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  numberOfGuests: int("number_of_guests").notNull().default(2),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  specialRequests: text("special_requests"),
  status: mysqlEnum("status", ["pending", "confirmed", "pending_payment", "paid", "cash_on_site", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * News/Announcements table
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["announcement", "promotion", "event"]).default("announcement").notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  isPublished: boolean("is_published").default(true).notNull(),
  publishDate: timestamp("publish_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * Facilities table - hotel amenities and services
 */
export const facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }), // lucide icon name
  images: text("images"), // JSON array of image URLs
  displayOrder: int("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
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
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Room availability table - stores which dates are available for booking
 */
export const roomAvailability = mysqlTable("room_availability", {
  id: int("id").autoincrement().primaryKey(),
  roomTypeId: int("room_type_id").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  maxSalesQuantity: int("max_sales_quantity").default(10).notNull(), // maximum number of rooms that can be sold on this date
  bookedQuantity: int("booked_quantity").default(0).notNull(), // number of rooms already booked
  weekdayPrice: decimal("weekday_price", { precision: 10, scale: 2 }), // override price for this date (weekday)
  weekendPrice: decimal("weekend_price", { precision: 10, scale: 2 }), // override price for this date (weekend)
  isHolidayOverride: boolean("is_holiday_override"), // null = auto-detect, true = force holiday, false = force weekday
  reason: varchar("reason", { length: 200 }), // optional reason for unavailability
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RoomAvailability = typeof roomAvailability.$inferSelect;
export type InsertRoomAvailability = typeof roomAvailability.$inferInsert;

/**
 * Home page configuration table - stores carousel and feature images
 */
export const homeConfig = mysqlTable("home_config", {
  id: int("id").autoincrement().primaryKey(),
  carouselImages: text("carousel_images"), // JSON array of carousel image URLs
  vipGarageImage: varchar("vip_garage_image", { length: 500 }),
  deluxeRoomImage: varchar("deluxe_room_image", { length: 500 }),
  facilitiesImage: varchar("facilities_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HomeConfig = typeof homeConfig.$inferSelect;
export type InsertHomeConfig = typeof homeConfig.$inferInsert;


/**
 * Featured services configuration table - stores featured services with images and descriptions
 */
export const featuredServices = mysqlTable("featured_services", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  image: varchar("image", { length: 500 }),
  displayOrder: int("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FeaturedService = typeof featuredServices.$inferSelect;
export type InsertFeaturedService = typeof featuredServices.$inferInsert;

/**
 * Payment details table - stores payment information for bookings
 */
export const paymentDetails = mysqlTable("payment_details", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("booking_id").notNull(),
  paymentMethod: mysqlEnum("payment_method", ["bank_transfer", "credit_card", "ecpay", "cash_on_site"]).default("bank_transfer").notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "received", "failed", "refunded"]).default("pending").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("TWD").notNull(),
  // Bank transfer specific fields
  bankName: varchar("bank_name", { length: 100 }),
  bankCode: varchar("bank_code", { length: 10 }),
  accountNumber: varchar("account_number", { length: 50 }),
  accountName: varchar("account_name", { length: 100 }),
  transferReference: varchar("transfer_reference", { length: 100 }), // transfer memo/reference number
  transferDate: timestamp("transfer_date"), // when the transfer was made
  lastFiveDigits: varchar("last_five_digits", { length: 5 }), // last 5 digits of transfer for verification
  // Payment confirmation
  confirmedAt: timestamp("confirmed_at"), // when payment was confirmed
  confirmedBy: int("confirmed_by"), // admin user who confirmed the payment
  notes: text("notes"), // additional notes about the payment
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PaymentDetail = typeof paymentDetails.$inferSelect;
export type InsertPaymentDetail = typeof paymentDetails.$inferInsert;
