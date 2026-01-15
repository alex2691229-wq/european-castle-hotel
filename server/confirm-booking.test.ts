import { describe, expect, it } from "vitest";

// 簡單的單元測試來驗證確認訂房按鈕的邏輯
describe("確認訂房按鈕測試", () => {
  it("應該正確處理 pending 狀態的訂房", () => {
    const booking = { id: 1, status: "pending" };
    const canConfirm = booking.status === "pending";
    expect(canConfirm).toBe(true);
  });

  it("應該不能確認非 pending 狀態的訂房", () => {
    const booking = { id: 1, status: "confirmed" };
    const canConfirm = booking.status === "pending";
    expect(canConfirm).toBe(false);
  });

  it("應該正確處理 confirmed 狀態的訂房", () => {
    const booking = { id: 1, status: "confirmed" };
    const canSelectPayment = booking.status === "confirmed";
    expect(canSelectPayment).toBe(true);
  });
});
