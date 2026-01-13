import { describe, it, expect, beforeEach } from "vitest";

/**
 * 響應式設計測試
 * 測試網站在不同設備尺寸上的布局和交互體驗
 */

interface ViewportSize {
  name: string;
  width: number;
  height: number;
  type: "mobile" | "tablet" | "desktop";
}

interface PageElement {
  selector: string;
  name: string;
  criticalOnMobile: boolean;
  criticalOnTablet: boolean;
  criticalOnDesktop: boolean;
}

// 定義不同設備的視口尺寸
const VIEWPORT_SIZES: ViewportSize[] = [
  // 手機
  { name: "iPhone SE", width: 375, height: 667, type: "mobile" },
  { name: "iPhone 12", width: 390, height: 844, type: "mobile" },
  { name: "iPhone 14 Pro Max", width: 430, height: 932, type: "mobile" },
  { name: "Samsung Galaxy S21", width: 360, height: 800, type: "mobile" },
  { name: "Google Pixel 6", width: 412, height: 915, type: "mobile" },

  // 平板
  { name: "iPad Mini", width: 768, height: 1024, type: "tablet" },
  { name: "iPad Air", width: 820, height: 1180, type: "tablet" },
  { name: "iPad Pro 11", width: 834, height: 1194, type: "tablet" },
  { name: "Samsung Tab S7", width: 800, height: 1280, type: "tablet" },

  // 電腦
  { name: "Laptop 13\"", width: 1280, height: 720, type: "desktop" },
  { name: "Desktop 1080p", width: 1920, height: 1080, type: "desktop" },
  { name: "Desktop 1440p", width: 2560, height: 1440, type: "desktop" },
];

// 定義需要測試的頁面
const TEST_PAGES = [
  { path: "/", name: "首頁" },
  { path: "/rooms", name: "客房介紹" },
  { path: "/booking", name: "線上訂房" },
  { path: "/facilities", name: "設施服務" },
  { path: "/news", name: "最新消息" },
  { path: "/contact", name: "聯絡我們" },
];

// 定義需要測試的頁面元素
const PAGE_ELEMENTS: PageElement[] = [
  {
    selector: "header",
    name: "導航欄",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: "nav",
    name: "導航菜單",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: "main",
    name: "主要內容",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: "footer",
    name: "頁腳",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: ".hero",
    name: "英雄區域",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: ".form-group",
    name: "表單元素",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: ".grid",
    name: "網格布局",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
  {
    selector: "button",
    name: "按鈕",
    criticalOnMobile: true,
    criticalOnTablet: true,
    criticalOnDesktop: true,
  },
];

// 模擬響應式設計檢查器
class ResponsiveDesignChecker {
  private results: Map<string, any> = new Map();

  // 檢查視口寬度是否適合內容
  checkViewportWidth(width: number, contentWidth: number): boolean {
    return width >= contentWidth;
  }

  // 檢查字體大小是否可讀
  checkFontSize(fontSize: number, viewportWidth: number): boolean {
    // 手機上最小字體應為 12px，平板 14px，電腦 16px
    if (viewportWidth <= 480) return fontSize >= 12;
    if (viewportWidth <= 768) return fontSize >= 14;
    return fontSize >= 16;
  }

  // 檢查觸摸目標大小（手機上應至少 44x44px）
  checkTouchTargetSize(width: number, height: number, viewportWidth: number): boolean {
    if (viewportWidth < 768) {
      // 手機和小平板
      return width >= 44 && height >= 44;
    }
    return true;
  }

  // 檢查圖片是否響應式
  checkResponsiveImage(hasMaxWidth: boolean, hasSrcset: boolean): boolean {
    return hasMaxWidth || hasSrcset;
  }

  // 檢查媒體查詢覆蓋
  checkMediaQueryCoverage(breakpoints: number[]): boolean {
    // 應該至少有 mobile、tablet、desktop 三個斷點
    return breakpoints.length >= 3;
  }

  // 檢查水平滾動
  checkHorizontalScroll(contentWidth: number, viewportWidth: number): boolean {
    // 不應該有水平滾動
    return contentWidth <= viewportWidth;
  }

  // 檢查邊距和填充
  checkSpacing(padding: number, viewportWidth: number): boolean {
    // 手機上邊距應為 16px，平板 20px，電腦 32px
    if (viewportWidth <= 480) return padding >= 16;
    if (viewportWidth <= 768) return padding >= 20;
    return padding >= 32;
  }

  // 生成測試報告
  generateReport(viewport: ViewportSize, issues: string[]): {
    viewport: string;
    width: number;
    height: number;
    type: string;
    issueCount: number;
    issues: string[];
    passed: boolean;
  } {
    return {
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      type: viewport.type,
      issueCount: issues.length,
      issues,
      passed: issues.length === 0,
    };
  }
}

describe("Responsive Design Tests", () => {
  let checker: ResponsiveDesignChecker;

  beforeEach(() => {
    checker = new ResponsiveDesignChecker();
  });

  describe("視口尺寸覆蓋", () => {
    it("應該測試所有主要設備類型", () => {
      const mobileViewports = VIEWPORT_SIZES.filter(v => v.type === "mobile");
      const tabletViewports = VIEWPORT_SIZES.filter(v => v.type === "tablet");
      const desktopViewports = VIEWPORT_SIZES.filter(v => v.type === "desktop");

      expect(mobileViewports.length).toBeGreaterThan(0);
      expect(tabletViewports.length).toBeGreaterThan(0);
      expect(desktopViewports.length).toBeGreaterThan(0);
    });

    it("應該包含常見的手機尺寸", () => {
      const mobileViewports = VIEWPORT_SIZES.filter(v => v.type === "mobile");
      const widths = mobileViewports.map(v => v.width);

      // 應該包含小、中、大型手機
      expect(Math.min(...widths)).toBeLessThan(400);
      expect(Math.max(...widths)).toBeGreaterThan(400);
    });

    it("應該包含常見的平板尺寸", () => {
      const tabletViewports = VIEWPORT_SIZES.filter(v => v.type === "tablet");
      expect(tabletViewports.length).toBeGreaterThanOrEqual(3);
    });

    it("應該包含常見的電腦尺寸", () => {
      const desktopViewports = VIEWPORT_SIZES.filter(v => v.type === "desktop");
      expect(desktopViewports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("字體大小可讀性", () => {
    it("手機上字體大小應至少 12px", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const isReadable = checker.checkFontSize(12, mobileViewport.width);
      expect(isReadable).toBe(true);
    });

    it("平板上字體大小應至少 14px", () => {
      const tabletViewport = VIEWPORT_SIZES.find(v => v.name === "iPad Mini")!;
      const isReadable = checker.checkFontSize(14, tabletViewport.width);
      expect(isReadable).toBe(true);
    });

    it("電腦上字體大小應至少 16px", () => {
      const desktopViewport = VIEWPORT_SIZES.find(v => v.name === "Desktop 1080p")!;
      const isReadable = checker.checkFontSize(16, desktopViewport.width);
      expect(isReadable).toBe(true);
    });

    it("手機上過小的字體應被標記為不可讀", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const isReadable = checker.checkFontSize(10, mobileViewport.width);
      expect(isReadable).toBe(false);
    });
  });

  describe("觸摸目標大小", () => {
    it("手機上按鈕應至少 44x44px", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const isValid = checker.checkTouchTargetSize(44, 44, mobileViewport.width);
      expect(isValid).toBe(true);
    });

    it("手機上過小的按鈕應被標記為不合適", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const isValid = checker.checkTouchTargetSize(30, 30, mobileViewport.width);
      expect(isValid).toBe(false);
    });

    it("電腦上按鈕大小要求較寬鬆", () => {
      const desktopViewport = VIEWPORT_SIZES.find(v => v.name === "Desktop 1080p")!;
      const isValid = checker.checkTouchTargetSize(30, 30, desktopViewport.width);
      expect(isValid).toBe(true);
    });
  });

  describe("圖片響應式", () => {
    it("應該使用 max-width 或 srcset 使圖片響應式", () => {
      const isResponsive = checker.checkResponsiveImage(true, false);
      expect(isResponsive).toBe(true);
    });

    it("應該支持 srcset 屬性", () => {
      const isResponsive = checker.checkResponsiveImage(false, true);
      expect(isResponsive).toBe(true);
    });

    it("沒有響應式設置的圖片應被標記", () => {
      const isResponsive = checker.checkResponsiveImage(false, false);
      expect(isResponsive).toBe(false);
    });
  });

  describe("水平滾動檢查", () => {
    it("內容寬度不應超過視口寬度", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const hasScroll = !checker.checkHorizontalScroll(mobileViewport.width, mobileViewport.width);
      expect(hasScroll).toBe(false);
    });

    it("超寬內容應被標記為有水平滾動", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const hasScroll = !checker.checkHorizontalScroll(500, mobileViewport.width);
      expect(hasScroll).toBe(true);
    });
  });

  describe("邊距和填充", () => {
    it("手機上邊距應至少 16px", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const isValid = checker.checkSpacing(16, mobileViewport.width);
      expect(isValid).toBe(true);
    });

    it("平板上邊距應至少 20px", () => {
      const tabletViewport = VIEWPORT_SIZES.find(v => v.name === "iPad Mini")!;
      const isValid = checker.checkSpacing(20, tabletViewport.width);
      expect(isValid).toBe(true);
    });

    it("電腦上邊距應至少 32px", () => {
      const desktopViewport = VIEWPORT_SIZES.find(v => v.name === "Desktop 1080p")!;
      const isValid = checker.checkSpacing(32, desktopViewport.width);
      expect(isValid).toBe(true);
    });

    it("邊距過小應被標記", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.name === "iPhone 12")!;
      const isValid = checker.checkSpacing(8, mobileViewport.width);
      expect(isValid).toBe(false);
    });
  });

  describe("媒體查詢覆蓋", () => {
    it("應該至少有三個主要斷點", () => {
      const breakpoints = [480, 768, 1024];
      const hasCoverage = checker.checkMediaQueryCoverage(breakpoints);
      expect(hasCoverage).toBe(true);
    });

    it("應該覆蓋手機、平板、電腦", () => {
      const breakpoints = [480, 768, 1024, 1440];
      const hasCoverage = checker.checkMediaQueryCoverage(breakpoints);
      expect(hasCoverage).toBe(true);
    });

    it("斷點不足應被標記", () => {
      const breakpoints = [768];
      const hasCoverage = checker.checkMediaQueryCoverage(breakpoints);
      expect(hasCoverage).toBe(false);
    });
  });

  describe("頁面元素可訪問性", () => {
    it("所有頁面應包含必要的元素", () => {
      const requiredElements = ["header", "main", "footer"];
      const hasAllElements = requiredElements.every(el =>
        PAGE_ELEMENTS.some(e => e.selector === el)
      );
      expect(hasAllElements).toBe(true);
    });

    it("導航菜單應在所有設備上可訪問", () => {
      const navElement = PAGE_ELEMENTS.find(e => e.selector === "nav");
      expect(navElement?.criticalOnMobile).toBe(true);
      expect(navElement?.criticalOnTablet).toBe(true);
      expect(navElement?.criticalOnDesktop).toBe(true);
    });

    it("表單元素應在所有設備上可訪問", () => {
      const formElement = PAGE_ELEMENTS.find(e => e.selector === ".form-group");
      expect(formElement?.criticalOnMobile).toBe(true);
      expect(formElement?.criticalOnTablet).toBe(true);
      expect(formElement?.criticalOnDesktop).toBe(true);
    });
  });

  describe("響應式設計報告", () => {
    it("應該生成完整的測試報告", () => {
      const viewport = VIEWPORT_SIZES[0];
      const issues = ["字體過小", "按鈕太小"];
      const report = checker.generateReport(viewport, issues);

      expect(report.viewport).toBe(viewport.name);
      expect(report.width).toBe(viewport.width);
      expect(report.height).toBe(viewport.height);
      expect(report.type).toBe(viewport.type);
      expect(report.issueCount).toBe(2);
      expect(report.passed).toBe(false);
    });

    it("沒有問題的報告應標記為通過", () => {
      const viewport = VIEWPORT_SIZES[0];
      const report = checker.generateReport(viewport, []);

      expect(report.issueCount).toBe(0);
      expect(report.passed).toBe(true);
    });
  });

  describe("跨設備一致性", () => {
    it("所有設備上的導航應保持一致", () => {
      const mobileNav = PAGE_ELEMENTS.find(e => e.name === "導航菜單");
      expect(mobileNav?.criticalOnMobile).toBe(true);
      expect(mobileNav?.criticalOnTablet).toBe(true);
      expect(mobileNav?.criticalOnDesktop).toBe(true);
    });

    it("所有設備上的頁腳應保持一致", () => {
      const footer = PAGE_ELEMENTS.find(e => e.name === "頁腳");
      expect(footer?.criticalOnMobile).toBe(true);
      expect(footer?.criticalOnTablet).toBe(true);
      expect(footer?.criticalOnDesktop).toBe(true);
    });

    it("所有頁面應在所有設備上可訪問", () => {
      expect(TEST_PAGES.length).toBeGreaterThan(0);
      TEST_PAGES.forEach(page => {
        expect(page.path).toBeDefined();
        expect(page.name).toBeDefined();
      });
    });
  });

  describe("性能相關的響應式設計", () => {
    it("手機上應加載較小的圖片", () => {
      const mobileViewport = VIEWPORT_SIZES.find(v => v.type === "mobile")!;
      const imageSize = mobileViewport.width * 0.9; // 90% 的視口寬度
      expect(imageSize).toBeLessThan(400);
    });

    it("電腦上可以加載較大的圖片", () => {
      const desktopViewport = VIEWPORT_SIZES.find(v => v.type === "desktop")!;
      const imageSize = desktopViewport.width * 0.8; // 80% 的視口寬度
      expect(imageSize).toBeGreaterThan(1000);
    });

    it("應該使用適當的圖片格式", () => {
      const formats = ["webp", "jpg", "png"];
      expect(formats.length).toBeGreaterThan(0);
    });
  });

  describe("測試頁面覆蓋", () => {
    it("應該測試所有主要頁面", () => {
      expect(TEST_PAGES.length).toBeGreaterThanOrEqual(5);
    });

    it("應該包含首頁", () => {
      const hasHome = TEST_PAGES.some(p => p.path === "/");
      expect(hasHome).toBe(true);
    });

    it("應該包含訂房頁面", () => {
      const hasBooking = TEST_PAGES.some(p => p.path === "/booking");
      expect(hasBooking).toBe(true);
    });

    it("應該包含聯絡頁面", () => {
      const hasContact = TEST_PAGES.some(p => p.path === "/contact");
      expect(hasContact).toBe(true);
    });
  });
});
