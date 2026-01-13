import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Room Availability Management", () => {
  let testRoomTypeId: number;

  beforeAll(async () => {
    // Create a test room type
    testRoomTypeId = await db.createRoomType({
      name: "測試房型",
      description: "用於測試可用性管理的房型",
      capacity: 2,
      price: "1000",
      weekendPrice: "1200",
      displayOrder: 999,
    });
  });

  it("should set room availability for specific dates", async () => {
    const testDates = [
      new Date("2026-02-01"),
      new Date("2026-02-02"),
      new Date("2026-02-03"),
    ];

    await db.setRoomAvailability(
      testRoomTypeId,
      testDates,
      false,
      "測試關閉預訂"
    );

    // Verify availability was set
    const availability = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      new Date("2026-02-01"),
      new Date("2026-02-03")
    );

    expect(availability.length).toBeGreaterThan(0);
    expect(availability.every(record => !record.isAvailable)).toBe(true);
  });

  it("should retrieve unavailable dates including admin blocks and bookings", async () => {
    // Set some dates as unavailable
    const blockedDates = [
      new Date("2026-03-01"),
      new Date("2026-03-02"),
    ];

    await db.setRoomAvailability(
      testRoomTypeId,
      blockedDates,
      false,
      "維護期間"
    );

    // Get unavailable dates
    const unavailableDates = await db.getUnavailableDates(
      testRoomTypeId,
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );

    expect(unavailableDates.length).toBeGreaterThan(0);
    
    // Check that blocked dates are in the result
    const unavailableDateStrings = unavailableDates.map(d => {
      if (d.date instanceof Date) {
        return d.date.toISOString().split('T')[0];
      }
      const dateObj = new Date(String(d.date));
      return dateObj.toISOString().split('T')[0];
    });
    expect(unavailableDateStrings).toContain("2026-03-01");
    expect(unavailableDateStrings).toContain("2026-03-02");
  });

  it("should update existing availability records", async () => {
    const testDate = new Date("2026-04-01");

    // First, set as unavailable
    await db.setRoomAvailability(
      testRoomTypeId,
      [testDate],
      false,
      "初始關閉"
    );

    // Then, set as available
    await db.setRoomAvailability(
      testRoomTypeId,
      [testDate],
      true
    );

    // Verify it's now available
    const availability = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      testDate,
      testDate
    );

    expect(availability.length).toBeGreaterThan(0);
    expect(availability[0].isAvailable).toBe(true);
  });

  it("should handle date range queries correctly", async () => {
    const startDate = new Date("2026-05-01");
    const endDate = new Date("2026-05-10");
    const testDates = [
      new Date("2026-05-05"),
      new Date("2026-05-06"),
      new Date("2026-05-07"),
    ];

    await db.setRoomAvailability(
      testRoomTypeId,
      testDates,
      false,
      "特殊活動期間"
    );

    const availability = await db.getRoomAvailabilityByDateRange(
      testRoomTypeId,
      startDate,
      endDate
    );

    // Should only return records within the date range
    expect(availability.every(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    })).toBe(true);
  });

  it("should include booked dates in unavailable dates", async () => {
    // Create a booking
    const checkInDate = new Date("2026-06-15");
    const checkOutDate = new Date("2026-06-17");

    await db.createBooking({
      roomTypeId: testRoomTypeId,
      guestName: "測試訪客",
      guestPhone: "0912345678",
      checkInDate,
      checkOutDate,
      numberOfGuests: 2,
      totalPrice: "2000",
      status: "confirmed",
    });

    // Get unavailable dates
    const unavailableDates = await db.getUnavailableDates(
      testRoomTypeId,
      new Date("2026-06-01"),
      new Date("2026-06-30")
    );

    // Check that booking dates are included
    const unavailableDateStrings = unavailableDates.map(d => {
      if (d.date instanceof Date) {
        return d.date.toISOString().split('T')[0];
      }
      const dateObj = new Date(String(d.date));
      return dateObj.toISOString().split('T')[0];
    });
    
    expect(unavailableDateStrings).toContain("2026-06-15");
    expect(unavailableDateStrings).toContain("2026-06-16");
  });
});
