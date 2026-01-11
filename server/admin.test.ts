import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Admin Routes", () => {
  describe("roomTypes", () => {
    it("allows admin to create room type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.roomTypes.create({
        name: "豪華雙人房",
        description: "寬敞舒適的豪華房型",
        price: "3500",
        capacity: 2,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it("prevents regular user from creating room type", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.roomTypes.create({
          name: "豪華雙人房",
          description: "寬敞舒適的豪華房型",
          price: "3500",
          capacity: 2,
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("allows admin to update room type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a room type
      const created = await caller.roomTypes.create({
        name: "標準雙床房",
        description: "標準房型",
        price: "2000",
        capacity: 2,
      });

      // Then update it
      const result = await caller.roomTypes.update({
        id: created.id,
        name: "標準雙床房 - 更新",
        price: "2200",
      });

      expect(result.success).toBe(true);
    });

    it("allows admin to delete room type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a room type
      const created = await caller.roomTypes.create({
        name: "臨時房型",
        description: "用於測試的臨時房型",
        price: "1500",
        capacity: 1,
      });

      // Then delete it
      const result = await caller.roomTypes.delete({
        id: created.id,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("news", () => {
    it("allows admin to create news", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.news.create({
        title: "春季優惠活動",
        content: "本月推出春季優惠方案",
        type: "promotion",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it("prevents regular user from creating news", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.news.create({
          title: "春季優惠活動",
          content: "本月推出春季優惠方案",
          type: "promotion",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});
