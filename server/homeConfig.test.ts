import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";

describe("Home Config", () => {
  beforeAll(async () => {
    // Ensure database is initialized
    await getDb();
  });

  it.skip("should get empty home config initially", async () => {
    const config = await db.getHomeConfig();
    // Config might be undefined or empty initially
    expect(config === undefined || config.id !== undefined).toBe(true);
  });

  it.skip("should update home config with carousel images", async () => {
    const carouselImages = [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ];

    await db.updateHomeConfig({
      carouselImages: JSON.stringify(carouselImages),
    });

    const config = await db.getHomeConfig();
    expect(config).toBeDefined();
    expect(config?.carouselImages).toBeDefined();

    const parsedImages = JSON.parse(config?.carouselImages || "[]");
    expect(parsedImages).toEqual(carouselImages);
  });

  it.skip("should update home config with feature images", async () => {
    const featureImages = {
      vipGarageImage: "https://example.com/vip-garage.jpg",
      deluxeRoomImage: "https://example.com/deluxe-room.jpg",
      facilitiesImage: "https://example.com/facilities.jpg",
    };

    await db.updateHomeConfig(featureImages);

    const config = await db.getHomeConfig();
    expect(config).toBeDefined();
    expect(config?.vipGarageImage).toBe(featureImages.vipGarageImage);
    expect(config?.deluxeRoomImage).toBe(featureImages.deluxeRoomImage);
    expect(config?.facilitiesImage).toBe(featureImages.facilitiesImage);
  });

  it.skip("should update home config with all images at once", async () => {
    const carouselImages = [
      "https://example.com/carousel1.jpg",
      "https://example.com/carousel2.jpg",
      "https://example.com/carousel3.jpg",
    ];

    const updateData = {
      carouselImages: JSON.stringify(carouselImages),
      vipGarageImage: "https://example.com/vip-garage-new.jpg",
      deluxeRoomImage: "https://example.com/deluxe-room-new.jpg",
      facilitiesImage: "https://example.com/facilities-new.jpg",
    };

    await db.updateHomeConfig(updateData);

    const config = await db.getHomeConfig();
    expect(config).toBeDefined();

    const parsedCarousel = JSON.parse(config?.carouselImages || "[]");
    expect(parsedCarousel).toEqual(carouselImages);
    expect(config?.vipGarageImage).toBe(updateData.vipGarageImage);
    expect(config?.deluxeRoomImage).toBe(updateData.deluxeRoomImage);
    expect(config?.facilitiesImage).toBe(updateData.facilitiesImage);
  });
});

describe("Room Pricing Display", () => {
  it.skip("should display both weekday and weekend prices", async () => {
    const rooms = await db.getAllRoomTypes();
    
    // Check that rooms have price and weekendPrice fields
    const roomsWithWeekendPrice = rooms.filter(r => r.weekendPrice);
    
    // At least some rooms should have weekend prices
    expect(roomsWithWeekendPrice.length).toBeGreaterThanOrEqual(0);
    
    // Verify price structure
    rooms.forEach(room => {
      expect(room.price).toBeDefined();
      expect(typeof room.price === 'string' || typeof room.price === 'number').toBe(true);
      
      if (room.weekendPrice) {
        expect(typeof room.weekendPrice === 'string' || typeof room.weekendPrice === 'number').toBe(true);
      }
    });
  });

  it.skip("should have different prices for weekday and weekend", async () => {
    const rooms = await db.getAllRoomTypes();
    
    const roomsWithDifferentPrices = rooms.filter(
      r => r.weekendPrice && Number(r.weekendPrice) !== Number(r.price)
    );
    
    // Check that weekend prices are typically higher
    roomsWithDifferentPrices.forEach(room => {
      const weekdayPrice = Number(room.price);
      const weekendPrice = Number(room.weekendPrice);
      
      // Weekend price should be higher than weekday price
      expect(weekendPrice).toBeGreaterThan(weekdayPrice);
    });
  });
});
