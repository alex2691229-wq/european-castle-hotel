/**
 * 台灣國定假日和民俗節日計算工具
 * 根據總統114年5月28日華總一義字第11400053171號令公布
 */

// 陽曆固定假日（放假）
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: '中華民國開國紀念日' },
  { month: 2, day: 28, name: '和平紀念日' },
  { month: 9, day: 28, name: '孔子誕辰紀念日' },
  { month: 10, day: 10, name: '國慶日' },
  { month: 10, day: 25, name: '臺灣光復暨金門古寧頭大捷紀念日' },
  { month: 12, day: 25, name: '行憲紀念日' },
];

// 農曆固定假日（放假）
const LUNAR_HOLIDAYS = [
  { lunarMonth: 1, lunarDay: 1, name: '春節' },
  { lunarMonth: 1, lunarDay: 15, name: '元宵節' },
  { lunarMonth: 5, lunarDay: 5, name: '端午節' },
  { lunarMonth: 8, lunarDay: 15, name: '中秋節' },
];

// 其他民俗節日（不放假但應視為假日以套用假日價格）
const OTHER_FESTIVALS = [
  { month: 1, day: 19, name: '消防節' },
  { month: 3, day: 8, name: '婦女節' },
  { month: 3, day: 12, name: '植樹節' },
  { month: 3, day: 29, name: '青年節' },
  { month: 3, day: 30, name: '國際醫師節' },
  { month: 4, day: 4, name: '兒童節' },
  { month: 5, day: 1, name: '勞動節' },
  { month: 5, day: 12, name: '國際護理師節' },
  { month: 6, day: 5, name: '環境日' },
  { month: 6, day: 8, name: '國家海洋日' },
  { month: 6, day: 15, name: '警察節' },
  { month: 7, day: 1, name: '漁民節' },
  { month: 8, day: 8, name: '父親節' },
  { month: 9, day: 3, name: '軍人節' },
  { month: 9, day: 9, name: '國民體育日' },
  { month: 11, day: 8, name: '海巡節' },
  { month: 12, day: 3, name: '身心障礙者日' },
  { month: 12, day: 10, name: '人權日' },
  { month: 12, day: 18, name: '移民日' },
];

/**
 * 農曆轉陽曆的簡化演算法
 * 這是一個基於已知農曆日期的查表法
 * 對於2024-2026年的常見節日
 */
const LUNAR_TO_SOLAR_2024_2026: Record<string, { month: number; day: number }> = {
  '2024-1-1': { month: 2, day: 10 }, // 春節
  '2024-1-15': { month: 2, day: 24 }, // 元宵節
  '2024-5-5': { month: 6, day: 10 }, // 端午節
  '2024-8-15': { month: 9, day: 18 }, // 中秋節
  '2025-1-1': { month: 1, day: 29 }, // 春節
  '2025-1-15': { month: 2, day: 12 }, // 元宵節
  '2025-5-5': { month: 5, day: 31 }, // 端午節
  '2025-8-15': { month: 9, day: 6 }, // 中秋節
  '2026-1-1': { month: 2, day: 17 }, // 春節
  '2026-1-15': { month: 3, day: 3 }, // 元宵節
  '2026-5-5': { month: 6, day: 20 }, // 端午節
  '2026-8-15': { month: 9, day: 25 }, // 中秋節
};

/**
 * 檢查是否為母親節（5月第二個星期日）
 */
function isMothersDay(date: Date): boolean {
  if (date.getMonth() !== 4) return false; // 5月是索引4
  const dayOfWeek = date.getDay();
  const dateOfMonth = date.getDate();
  
  // 找出5月第二個星期日
  const firstDay = new Date(date.getFullYear(), 4, 1);
  const firstSunday = 1 + (7 - firstDay.getDay());
  const secondSunday = firstSunday + 7;
  
  return dateOfMonth === secondSunday;
}

/**
 * 檢查是否為祖父母節（8月第四個星期日）
 */
function isGrandparentsDay(date: Date): boolean {
  if (date.getMonth() !== 7) return false; // 8月是索引7
  const dayOfWeek = date.getDay();
  const dateOfMonth = date.getDate();
  
  // 找出8月第四個星期日
  const firstDay = new Date(date.getFullYear(), 7, 1);
  const firstSunday = 1 + (7 - firstDay.getDay());
  const fourthSunday = firstSunday + 21;
  
  return dateOfMonth === fourthSunday;
}

/**
 * 將農曆日期轉換為陽曆
 */
function lunarToSolar(year: number, lunarMonth: number, lunarDay: number): Date | null {
  const key = `${year}-${lunarMonth}-${lunarDay}`;
  const solar = LUNAR_TO_SOLAR_2024_2026[key];
  
  if (!solar) {
    return null;
  }
  
  return new Date(year, solar.month - 1, solar.day);
}

/**
 * 檢查給定日期是否為台灣假日
 * @param date 要檢查的日期
 * @param manualOverride 手動覆蓋設定（如果存在，優先使用）
 * @returns 假日名稱，如果不是假日則返回 null
 */
export function getTaiwanHolidayName(date: Date, manualOverride?: boolean | null): string | null {
  // 如果有手動覆蓋，使用手動設定
  if (manualOverride === true) {
    return '手動設定假日';
  }
  if (manualOverride === false) {
    return null;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // 檢查陽曆固定假日
  for (const holiday of FIXED_HOLIDAYS) {
    if (holiday.month === month && holiday.day === day) {
      return holiday.name;
    }
  }

  // 檢查其他民俗節日
  for (const festival of OTHER_FESTIVALS) {
    if (festival.month === month && festival.day === day) {
      return festival.name;
    }
  }

  // 檢查特殊假日（母親節、祖父母節）
  if (isMothersDay(date)) {
    return '母親節';
  }
  if (isGrandparentsDay(date)) {
    return '祖父母節';
  }

  // 檢查農曆假日
  for (const holiday of LUNAR_HOLIDAYS) {
    const solarDate = lunarToSolar(year, holiday.lunarMonth, holiday.lunarDay);
    if (solarDate && solarDate.toDateString() === date.toDateString()) {
      return holiday.name;
    }
  }

  return null;
}

/**
 * 檢查給定日期是否為台灣假日
 * @param date 要檢查的日期
 * @param manualOverride 手動覆蓋設定
 * @returns true 如果是假日，false 如果是平日
 */
export function isTaiwanHoliday(date: Date, manualOverride?: boolean | null): boolean {
  if (manualOverride !== undefined && manualOverride !== null) {
    return manualOverride;
  }
  return getTaiwanHolidayName(date) !== null;
}

/**
 * 獲取日期範圍內的所有假日
 */
export function getHolidaysInRange(startDate: Date, endDate: Date): Array<{ date: Date; name: string }> {
  const holidays: Array<{ date: Date; name: string }> = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const holidayName = getTaiwanHolidayName(current);
    if (holidayName) {
      holidays.push({
        date: new Date(current),
        name: holidayName,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return holidays;
}
