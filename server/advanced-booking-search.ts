/**
 * 高級訂單搜尋功能
 * 支持多條件篩選、日期範圍、金額範圍等
 */

export type BookingStatus = 
  | "pending"      // 待確認
  | "confirmed"    // 已確認
  | "paid"         // 已匯款
  | "completed"    // 已付款
  | "finished"     // 已完成
  | "cancelled";   // 已取消

export interface SearchCriteria {
  // 基本搜尋
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  bookingId?: number;

  // 日期範圍
  checkInDateFrom?: Date;
  checkInDateTo?: Date;
  checkOutDateFrom?: Date;
  checkOutDateTo?: Date;
  createdDateFrom?: Date;
  createdDateTo?: Date;

  // 金額範圍
  priceFrom?: number;
  priceTo?: number;

  // 狀態篩選
  statuses?: BookingStatus[];

  // 房型篩選
  roomTypes?: string[];

  // 超期篩選
  overdueOnly?: boolean;
  daysOverdue?: number; // 超過 N 天未付款

  // 分頁
  limit?: number;
  offset?: number;

  // 排序
  sortBy?: "createdAt" | "checkInDate" | "price" | "guestName";
  sortOrder?: "asc" | "desc";
}

export interface SearchResult {
  id: number;
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: SearchCriteria;
  createdAt: Date;
  lastUsedAt?: Date;
  userId?: string;
}

/**
 * 搜尋條件驗證
 */
export function validateSearchCriteria(criteria: SearchCriteria): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 驗證日期範圍
  if (criteria.checkInDateFrom && criteria.checkInDateTo) {
    if (criteria.checkInDateFrom > criteria.checkInDateTo) {
      errors.push("入住日期範圍無效：開始日期不能晚於結束日期");
    }
  }

  if (criteria.checkOutDateFrom && criteria.checkOutDateTo) {
    if (criteria.checkOutDateFrom > criteria.checkOutDateTo) {
      errors.push("退房日期範圍無效：開始日期不能晚於結束日期");
    }
  }

  if (criteria.createdDateFrom && criteria.createdDateTo) {
    if (criteria.createdDateFrom > criteria.createdDateTo) {
      errors.push("創建日期範圍無效：開始日期不能晚於結束日期");
    }
  }

  // 驗證金額範圍
  if (criteria.priceFrom && criteria.priceTo) {
    if (criteria.priceFrom > criteria.priceTo) {
      errors.push("金額範圍無效：最小金額不能大於最大金額");
    }
  }

  // 驗證分頁參數
  if (criteria.limit && criteria.limit < 1) {
    errors.push("分頁數量必須大於 0");
  }

  if (criteria.offset && criteria.offset < 0) {
    errors.push("分頁偏移量不能為負數");
  }

  // 驗證超期天數
  if (criteria.daysOverdue && criteria.daysOverdue < 0) {
    errors.push("超期天數不能為負數");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 構建搜尋查詢條件
 */
export function buildSearchQuery(criteria: SearchCriteria): Record<string, any> {
  const query: Record<string, any> = {};

  // 基本搜尋
  if (criteria.guestName) {
    query.guestName = { contains: criteria.guestName, mode: "insensitive" };
  }

  if (criteria.guestEmail) {
    query.guestEmail = { contains: criteria.guestEmail, mode: "insensitive" };
  }

  if (criteria.guestPhone) {
    query.guestPhone = { contains: criteria.guestPhone };
  }

  if (criteria.bookingId) {
    query.id = criteria.bookingId;
  }

  // 日期範圍
  if (criteria.checkInDateFrom || criteria.checkInDateTo) {
    query.checkInDate = {};
    if (criteria.checkInDateFrom) {
      query.checkInDate.gte = criteria.checkInDateFrom;
    }
    if (criteria.checkInDateTo) {
      query.checkInDate.lte = criteria.checkInDateTo;
    }
  }

  if (criteria.checkOutDateFrom || criteria.checkOutDateTo) {
    query.checkOutDate = {};
    if (criteria.checkOutDateFrom) {
      query.checkOutDate.gte = criteria.checkOutDateFrom;
    }
    if (criteria.checkOutDateTo) {
      query.checkOutDate.lte = criteria.checkOutDateTo;
    }
  }

  if (criteria.createdDateFrom || criteria.createdDateTo) {
    query.createdAt = {};
    if (criteria.createdDateFrom) {
      query.createdAt.gte = criteria.createdDateFrom;
    }
    if (criteria.createdDateTo) {
      query.createdAt.lte = criteria.createdDateTo;
    }
  }

  // 金額範圍
  if (criteria.priceFrom || criteria.priceTo) {
    query.totalPrice = {};
    if (criteria.priceFrom) {
      query.totalPrice.gte = criteria.priceFrom;
    }
    if (criteria.priceTo) {
      query.totalPrice.lte = criteria.priceTo;
    }
  }

  // 狀態篩選
  if (criteria.statuses && criteria.statuses.length > 0) {
    query.status = { in: criteria.statuses };
  }

  // 房型篩選
  if (criteria.roomTypes && criteria.roomTypes.length > 0) {
    query.roomType = { in: criteria.roomTypes };
  }

  return query;
}

/**
 * 搜尋結果排序
 */
export function applySorting(
  results: SearchResult[],
  sortBy: string = "createdAt",
  sortOrder: string = "desc"
): SearchResult[] {
  const sorted = [...results];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "createdAt":
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      case "checkInDate":
        aValue = a.checkInDate.getTime();
        bValue = b.checkInDate.getTime();
        break;
      case "price":
        aValue = a.totalPrice;
        bValue = b.totalPrice;
        break;
      case "guestName":
        aValue = a.guestName.toLowerCase();
        bValue = b.guestName.toLowerCase();
        break;
      default:
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
}

/**
 * 應用分頁
 */
export function applyPagination(
  results: SearchResult[],
  limit: number = 10,
  offset: number = 0
): SearchResult[] {
  return results.slice(offset, offset + limit);
}

/**
 * 搜尋引擎
 */
export class BookingSearchEngine {
  private bookings: SearchResult[] = [];
  private savedSearches: Map<string, SavedSearch> = new Map();

  /**
   * 添加訂單到搜尋索引
   */
  addBooking(booking: SearchResult): void {
    this.bookings.push(booking);
  }

  /**
   * 清空搜尋索引
   */
  clearBookings(): void {
    this.bookings = [];
  }

  /**
   * 執行搜尋
   */
  search(criteria: SearchCriteria): { results: SearchResult[]; total: number } {
    // 驗證搜尋條件
    const validation = validateSearchCriteria(criteria);
    if (!validation.valid) {
      console.error("搜尋條件驗證失敗：", validation.errors);
      return { results: [], total: 0 };
    }

    // 篩選結果
    let results = this.filterBookings(criteria);

    // 應用超期篩選
    if (criteria.overdueOnly) {
      results = results.filter(b => b.isOverdue);
    }

    if (criteria.daysOverdue) {
      results = results.filter(b => b.daysOverdue >= criteria.daysOverdue!);
    }

    // 記錄總數
    const total = results.length;

    // 排序
    results = applySorting(
      results,
      criteria.sortBy || "createdAt",
      criteria.sortOrder || "desc"
    );

    // 分頁
    if (criteria.limit || criteria.offset) {
      results = applyPagination(
        results,
        criteria.limit || 10,
        criteria.offset || 0
      );
    }

    return { results, total };
  }

  /**
   * 篩選訂單
   */
  private filterBookings(criteria: SearchCriteria): SearchResult[] {
    return this.bookings.filter(booking => {
      // 基本搜尋
      if (criteria.guestName && !booking.guestName.toLowerCase().includes(criteria.guestName.toLowerCase())) {
        return false;
      }

      if (criteria.guestEmail && !booking.guestEmail.toLowerCase().includes(criteria.guestEmail.toLowerCase())) {
        return false;
      }

      if (criteria.guestPhone && !booking.guestPhone.includes(criteria.guestPhone)) {
        return false;
      }

      if (criteria.bookingId && booking.id !== criteria.bookingId) {
        return false;
      }

      // 日期範圍
      if (criteria.checkInDateFrom && booking.checkInDate < criteria.checkInDateFrom) {
        return false;
      }

      if (criteria.checkInDateTo && booking.checkInDate > criteria.checkInDateTo) {
        return false;
      }

      if (criteria.checkOutDateFrom && booking.checkOutDate < criteria.checkOutDateFrom) {
        return false;
      }

      if (criteria.checkOutDateTo && booking.checkOutDate > criteria.checkOutDateTo) {
        return false;
      }

      if (criteria.createdDateFrom && booking.createdAt < criteria.createdDateFrom) {
        return false;
      }

      if (criteria.createdDateTo && booking.createdAt > criteria.createdDateTo) {
        return false;
      }

      // 金額範圍
      if (criteria.priceFrom && booking.totalPrice < criteria.priceFrom) {
        return false;
      }

      if (criteria.priceTo && booking.totalPrice > criteria.priceTo) {
        return false;
      }

      // 狀態篩選
      if (criteria.statuses && criteria.statuses.length > 0 && !criteria.statuses.includes(booking.status)) {
        return false;
      }

      // 房型篩選
      if (criteria.roomTypes && criteria.roomTypes.length > 0 && !criteria.roomTypes.includes(booking.roomType)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 保存搜尋條件
   */
  saveSearch(name: string, criteria: SearchCriteria, userId?: string): SavedSearch {
    const search: SavedSearch = {
      id: `search_${Date.now()}_${Math.random()}`,
      name,
      criteria,
      createdAt: new Date(),
      userId,
    };

    this.savedSearches.set(search.id, search);
    console.log(`✅ 搜尋條件已保存：${name}`);
    return search;
  }

  /**
   * 獲取已保存的搜尋
   */
  getSavedSearches(userId?: string): SavedSearch[] {
    const searches = Array.from(this.savedSearches.values());

    if (userId) {
      return searches.filter(s => s.userId === userId);
    }

    return searches;
  }

  /**
   * 刪除已保存的搜尋
   */
  deleteSavedSearch(searchId: string): boolean {
    return this.savedSearches.delete(searchId);
  }

  /**
   * 執行已保存的搜尋
   */
  runSavedSearch(searchId: string): { results: SearchResult[]; total: number } | null {
    const search = this.savedSearches.get(searchId);

    if (!search) {
      return null;
    }

    // 更新最後使用時間
    search.lastUsedAt = new Date();

    return this.search(search.criteria);
  }

  /**
   * 獲取搜尋統計
   */
  getSearchStatistics(criteria: SearchCriteria): {
    totalBookings: number;
    totalRevenue: number;
    averagePrice: number;
    bookingsByStatus: Record<BookingStatus, number>;
  } {
    const results = this.filterBookings(criteria);

    const totalRevenue = results.reduce((sum, b) => sum + b.totalPrice, 0);
    const averagePrice = results.length > 0 ? totalRevenue / results.length : 0;

    const bookingsByStatus: Record<BookingStatus, number> = {
      pending: 0,
      confirmed: 0,
      paid: 0,
      completed: 0,
      finished: 0,
      cancelled: 0,
    };

    results.forEach(b => {
      bookingsByStatus[b.status]++;
    });

    return {
      totalBookings: results.length,
      totalRevenue,
      averagePrice,
      bookingsByStatus,
    };
  }
}

// 全局搜尋引擎實例
export const bookingSearchEngine = new BookingSearchEngine();
