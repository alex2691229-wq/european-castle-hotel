import { describe, it, expect, beforeEach } from "vitest";
import {
  BookingSearchEngine,
  validateSearchCriteria,
  buildSearchQuery,
  applySorting,
  applyPagination,
  SearchResult,
  SearchCriteria,
} from "./advanced-booking-search";

describe("Advanced Booking Search - 訂單搜尋增強", () => {
  let searchEngine: BookingSearchEngine;

  const mockBookings: SearchResult[] = [
    {
      id: 1,
      bookingId: "120030",
      guestName: "John Smith",
      guestEmail: "john@example.com",
      guestPhone: "0987654321",
      roomType: "六人家庭房",
      checkInDate: new Date("2026-01-20"),
      checkOutDate: new Date("2026-01-25"),
      totalPrice: 19900,
      status: "pending",
      createdAt: new Date("2026-01-14"),
      isOverdue: false,
      daysOverdue: 0,
    },
    {
      id: 2,
      bookingId: "120031",
      guestName: "Jane Doe",
      guestEmail: "jane@example.com",
      guestPhone: "0912345678",
      roomType: "四人房",
      checkInDate: new Date("2026-01-22"),
      checkOutDate: new Date("2026-01-24"),
      totalPrice: 8900,
      status: "confirmed",
      createdAt: new Date("2026-01-13"),
      isOverdue: false,
      daysOverdue: 0,
    },
    {
      id: 3,
      bookingId: "120032",
      guestName: "Bob Johnson",
      guestEmail: "bob@example.com",
      guestPhone: "0923456789",
      roomType: "雙人房",
      checkInDate: new Date("2026-01-25"),
      checkOutDate: new Date("2026-01-27"),
      totalPrice: 5900,
      status: "completed",
      createdAt: new Date("2026-01-10"),
      isOverdue: false,
      daysOverdue: 0,
    },
    {
      id: 4,
      bookingId: "120033",
      guestName: "Alice Brown",
      guestEmail: "alice@example.com",
      guestPhone: "0934567890",
      roomType: "六人家庭房",
      checkInDate: new Date("2026-02-01"),
      checkOutDate: new Date("2026-02-05"),
      totalPrice: 25900,
      status: "paid",
      createdAt: new Date("2026-01-08"),
      isOverdue: true,
      daysOverdue: 6,
    },
  ];

  beforeEach(() => {
    searchEngine = new BookingSearchEngine();
    mockBookings.forEach(booking => searchEngine.addBooking(booking));
  });

  describe("validateSearchCriteria - 搜尋條件驗證", () => {
    it("應該驗證有效的搜尋條件", () => {
      const criteria: SearchCriteria = {
        guestName: "John",
        priceFrom: 5000,
        priceTo: 20000,
      };

      const result = validateSearchCriteria(criteria);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      console.log("✅ 有效的搜尋條件驗證通過");
    });

    it("應該檢測無效的日期範圍", () => {
      const criteria: SearchCriteria = {
        checkInDateFrom: new Date("2026-01-25"),
        checkInDateTo: new Date("2026-01-20"),
      };

      const result = validateSearchCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      console.log("✅ 無效的日期範圍被檢測到");
    });

    it("應該檢測無效的金額範圍", () => {
      const criteria: SearchCriteria = {
        priceFrom: 20000,
        priceTo: 5000,
      };

      const result = validateSearchCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      console.log("✅ 無效的金額範圍被檢測到");
    });
  });

  describe("buildSearchQuery - 構建搜尋查詢", () => {
    it("應該構建客戶名搜尋查詢", () => {
      const criteria: SearchCriteria = { guestName: "John" };
      const query = buildSearchQuery(criteria);

      expect(query.guestName).toBeDefined();
      expect(query.guestName.contains).toBe("John");
      console.log("✅ 客戶名搜尋查詢已構建");
    });

    it("應該構建日期範圍搜尋查詢", () => {
      const criteria: SearchCriteria = {
        checkInDateFrom: new Date("2026-01-20"),
        checkInDateTo: new Date("2026-01-25"),
      };
      const query = buildSearchQuery(criteria);

      expect(query.checkInDate).toBeDefined();
      expect(query.checkInDate.gte).toBeDefined();
      expect(query.checkInDate.lte).toBeDefined();
      console.log("✅ 日期範圍搜尋查詢已構建");
    });

    it("應該構建金額範圍搜尋查詢", () => {
      const criteria: SearchCriteria = {
        priceFrom: 5000,
        priceTo: 20000,
      };
      const query = buildSearchQuery(criteria);

      expect(query.totalPrice).toBeDefined();
      expect(query.totalPrice.gte).toBe(5000);
      expect(query.totalPrice.lte).toBe(20000);
      console.log("✅ 金額範圍搜尋查詢已構建");
    });
  });

  describe("applySorting - 排序", () => {
    it("應該按建立時間降序排序", () => {
      const results = applySorting(mockBookings, "createdAt", "desc");

      expect(results[0].id).toBe(1); // 最新
      expect(results[results.length - 1].id).toBe(4); // 最舊
      console.log("✅ 按建立時間降序排序成功");
    });

    it("應該按客戶名升序排序", () => {
      const results = applySorting(mockBookings, "guestName", "asc");

      expect(results[0].guestName).toBe("Alice Brown");
      expect(results[results.length - 1].guestName).toBe("John Smith");
      console.log("✅ 按客戶名升序排序成功");
    });

    it("應該按金額降序排序", () => {
      const results = applySorting(mockBookings, "price", "desc");

      expect(results[0].totalPrice).toBe(25900); // 最高
      expect(results[results.length - 1].totalPrice).toBe(5900); // 最低
      console.log("✅ 按金額降序排序成功");
    });
  });

  describe("applyPagination - 分頁", () => {
    it("應該應用分頁限制", () => {
      const results = applyPagination(mockBookings, 2, 0);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(1);
      expect(results[1].id).toBe(2);
      console.log("✅ 分頁限制已應用");
    });

    it("應該應用分頁偏移", () => {
      const results = applyPagination(mockBookings, 2, 2);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(3);
      expect(results[1].id).toBe(4);
      console.log("✅ 分頁偏移已應用");
    });
  });

  describe("BookingSearchEngine - 搜尋引擎", () => {
    it("應該按客戶名戠尋", () => {
      const criteria: SearchCriteria = { guestName: "John" };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(2); // John Smith 和 Jane Doe 都包含 "John"
      expect(results[0].guestName).toContain("John");
      console.log("✅ 按客戶名戠尋成功");
    });

    it("應該按電話號碼搜尋", () => {
      const criteria: SearchCriteria = { guestPhone: "0987654321" };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(1);
      expect(results[0].guestPhone).toBe("0987654321");
      console.log("✅ 按電話號碼搜尋成功");
    });

    it("應該按日期範圍戠尋", () => {
      const criteria: SearchCriteria = {
        checkInDateFrom: new Date("2026-01-20"),
        checkInDateTo: new Date("2026-01-25"),
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(3); // 2026-01-20, 2026-01-22, 2026-01-25
      expect(results.every(r => r.checkInDate >= new Date("2026-01-20") && r.checkInDate <= new Date("2026-01-25"))).toBe(true);
      console.log("✅ 按日期範圍戠尋成功");
    });

    it("應該按金額範圍搜尋", () => {
      const criteria: SearchCriteria = {
        priceFrom: 5000,
        priceTo: 10000,
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(2); // 8900 和 5900
      expect(results.every(r => r.totalPrice >= 5000 && r.totalPrice <= 10000)).toBe(true);
      console.log("✅ 按金額範圍搜尋成功");
    });

    it("應該按狀態篩選", () => {
      const criteria: SearchCriteria = {
        statuses: ["pending", "confirmed"],
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(2);
      expect(results.every(r => ["pending", "confirmed"].includes(r.status))).toBe(true);
      console.log("✅ 按狀態篩選成功");
    });

    it("應該按房型篩選", () => {
      const criteria: SearchCriteria = {
        roomTypes: ["六人家庭房"],
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(2);
      expect(results.every(r => r.roomType === "六人家庭房")).toBe(true);
      console.log("✅ 按房型篩選成功");
    });

    it("應該篩選超期訂單", () => {
      const criteria: SearchCriteria = {
        overdueOnly: true,
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(1);
      expect(results[0].isOverdue).toBe(true);
      console.log("✅ 超期訂單篩選成功");
    });

    it("應該篩選超過 N 天未付款的訂單", () => {
      const criteria: SearchCriteria = {
        daysOverdue: 5,
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(1);
      expect(results[0].daysOverdue).toBeGreaterThanOrEqual(5);
      console.log("✅ 超過 N 天未付款的訂單篩選成功");
    });

    it("應該支持多條件組合搜尋", () => {
      const criteria: SearchCriteria = {
        roomTypes: ["六人家庭房"],
        statuses: ["pending", "paid"],
        priceFrom: 10000,
      };
      const { results, total } = searchEngine.search(criteria);

      expect(total).toBe(2);
      expect(results.every(r => 
        r.roomType === "六人家庭房" && 
        ["pending", "paid"].includes(r.status) && 
        r.totalPrice >= 10000
      )).toBe(true);
      console.log("✅ 多條件組合搜尋成功");
    });

    it("應該支持分頁搜尋", () => {
      const criteria: SearchCriteria = {
        limit: 2,
        offset: 0,
      };
      const { results, total } = searchEngine.search(criteria);

      expect(results).toHaveLength(2);
      expect(total).toBe(4);
      console.log("✅ 分頁搜尋成功");
    });

    it("應該保存搜尋條件", () => {
      const criteria: SearchCriteria = {
        roomTypes: ["六人家庭房"],
        statuses: ["pending"],
      };

      const saved = searchEngine.saveSearch("我的六人房待確認訂單", criteria, "user123");

      expect(saved.name).toBe("我的六人房待確認訂單");
      expect(saved.userId).toBe("user123");
      console.log("✅ 搜尋條件已保存");
    });

    it("應該獲取已保存的搜尋", () => {
      const criteria: SearchCriteria = { guestName: "John" };
      searchEngine.saveSearch("John 的訂單", criteria, "user123");

      const saved = searchEngine.getSavedSearches("user123");

      expect(saved.length).toBeGreaterThan(0);
      expect(saved[0].name).toBe("John 的訂單");
      console.log("✅ 已保存的搜尋已獲取");
    });

    it("應該執行已保存的戠尋", () => {
      const criteria: SearchCriteria = { guestName: "John" };
      const saved = searchEngine.saveSearch("John 的訂單", criteria);

      const { results, total } = searchEngine.runSavedSearch(saved.id) || { results: [], total: 0 };

      expect(total).toBe(2); // John Smith 和 Jane Doe 都包含 "John"
      expect(results[0].guestName).toContain("John");
      console.log("✅ 已保存的戠尋已執行");
    });

    it("應該獲取搜尋統計", () => {
      const criteria: SearchCriteria = {
        roomTypes: ["六人家庭房"],
      };

      const stats = searchEngine.getSearchStatistics(criteria);

      expect(stats.totalBookings).toBe(2);
      expect(stats.totalRevenue).toBe(45800); // 19900 + 25900
      expect(stats.averagePrice).toBe(22900);
      expect(stats.bookingsByStatus.pending).toBe(1);
      expect(stats.bookingsByStatus.paid).toBe(1);
      console.log("✅ 搜尋統計已獲取");
    });
  });
});
