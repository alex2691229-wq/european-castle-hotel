import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  const ctx: TrpcContext = {
    user: user || undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("bookings", () => {
  it("should allow public users to check room availability", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.checkAvailability({
      roomTypeId: 1,
      checkInDate: new Date("2026-02-01"),
      checkOutDate: new Date("2026-02-03"),
    });

    expect(result).toHaveProperty("isAvailable");
    expect(typeof result.isAvailable).toBe("boolean");
  });

  it("should create a booking with valid data", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.create({
      roomTypeId: 1,
      guestName: "測試客戶",
      guestPhone: "0912345678",
      checkInDate: new Date("2026-03-01"),
      checkOutDate: new Date("2026-03-03"),
      numberOfGuests: 2,
      totalPrice: "5600",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should create booking with email", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.create({
      roomTypeId: 1,
      guestName: "測試客戶",
      guestEmail: "test@example.com",
      guestPhone: "0912345678",
      checkInDate: new Date("2026-04-01"),
      checkOutDate: new Date("2026-04-03"),
      numberOfGuests: 2,
      totalPrice: "5600",
      specialRequests: "需要無菸房",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
  });
});

describe("roomTypes", () => {
  it("should list all available room types", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.roomTypes.list();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("price");
      expect(result[0]).toHaveProperty("isAvailable", true);
    }
  });

  it("should get room type by id", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.roomTypes.getById({ id: 1 });

    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("price");
  });
});

describe("contact", () => {
  it("should send contact message", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.send({
      name: "測試用戶",
      email: "test@example.com",
      message: "這是一則測試訊息",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
  });
});
