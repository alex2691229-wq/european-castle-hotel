import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("chat", () => {
  it("should respond to a question about rooms", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.ask({
      message: "你們有哪些房型？",
      history: [],
    });

    expect(result).toBeDefined();
    expect(result.reply).toBeDefined();
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  }, { timeout: 10000 });

  it("should handle conversation history", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.ask({
      message: "豪華雙人房多少錢？",
      history: [
        {
          role: "user",
          content: "你們有哪些房型？",
        },
        {
          role: "assistant",
          content: "我們有豪華雙人房、精緻套房等多種房型。",
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.reply).toBeDefined();
    expect(typeof result.reply).toBe("string");
  });

  it("should respond to questions about facilities", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.ask({
      message: "你們有什麼設施？",
      history: [],
    });

    expect(result).toBeDefined();
    expect(result.reply).toBeDefined();
    expect(typeof result.reply).toBe("string");
  });

  it("should respond to contact information requests", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.ask({
      message: "怎麼聯絡你們？",
      history: [],
    });

    expect(result).toBeDefined();
    expect(result.reply).toBeDefined();
    expect(result.reply).toContain("06-635-9577");
  });
});
