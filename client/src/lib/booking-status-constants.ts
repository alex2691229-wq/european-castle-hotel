// ========================================
// Booking Status Constants and Translations
// Auto-translate status and color coding
// ========================================

export enum BookingStatus {
  PENDING = 'PENDING',              // 待確認
  CONFIRMED = 'CONFIRMED',          // 已確認
  PAID = 'PAID',                    // 已付款
  CHECKED_IN = 'CHECKED_IN',        // 已入住
  CHECKED_OUT = 'CHECKED_OUT',      // 已退房
  CANCELLED = 'CANCELLED',          // 已取消
  NO_SHOW = 'NO_SHOW',              // 未到
  COMPLETED = 'COMPLETED',          // 已完成
}

export interface StatusConfig {
  label: string;           // 中文標籤
  color: string;          // 背景顏色 (tailwind)
  textColor: string;      // 文字顏色 (tailwind)
  icon?: string;          // 圖標
  description: string;    // 描述
}

export const BOOKING_STATUS_MAP: Record<BookingStatus, StatusConfig> = {
  [BookingStatus.PENDING]: {
    label: '待確認',
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: '⏳',
    description: '待客人確認或付款',
  },
  [BookingStatus.CONFIRMED]: {
    label: '已確認',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '✓',
    description: '客人已確認訂房',
  },
  [BookingStatus.PAID]: {
    label: '已付款',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '💰',
    description: '客人已付款，房間已預留',
  },
  [BookingStatus.CHECKED_IN]: {
    label: '已入住',
    color: 'bg-blue-200',
    textColor: 'text-blue-900',
    icon: '🏠',
    description: '客人已入住',
  },
  [BookingStatus.CHECKED_OUT]: {
    label: '已退房',
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '🚪',
    description: '客人已退房',
  },
  [BookingStatus.CANCELLED]: {
    label: '已取消',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '✕',
    description: '訂房已被取消',
  },
  [BookingStatus.NO_SHOW]: {
    label: '未到',
    color: 'bg-red-200',
    textColor: 'text-red-900',
    icon: '❌',
    description: '客人未準時到達',
  },
  [BookingStatus.COMPLETED]: {
    label: '已完成',
    color: 'bg-green-200',
    textColor: 'text-green-900',
    icon: '✓✓',
    description: '訂房流程已完成',
  },
};

export const getStatusLabel = (status: BookingStatus | string): string => {
  const config = BOOKING_STATUS_MAP[status as BookingStatus];
  return config?.label || status;
};

export const getStatusColor = (status: BookingStatus | string): string => {
  const config = BOOKING_STATUS_MAP[status as BookingStatus];
  return config?.color || 'bg-gray-100';
};

export const getStatusTextColor = (status: BookingStatus | string): string => {
  const config = BOOKING_STATUS_MAP[status as BookingStatus];
  return config?.textColor || 'text-gray-800';
};

export const getStatusIcon = (status: BookingStatus | string): string => {
  const config = BOOKING_STATUS_MAP[status as BookingStatus];
  return config?.icon || '•';
};

// Status flow rules
export const VALID_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.PAID,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.PAID]: [
    BookingStatus.CHECKED_IN,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.CHECKED_IN]: [
    BookingStatus.CHECKED_OUT,
    BookingStatus.NO_SHOW,
  ],
  [BookingStatus.CHECKED_OUT]: [
    BookingStatus.COMPLETED,
  ],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.NO_SHOW]: [],
  [BookingStatus.COMPLETED]: [],
};

export const canTransitionTo = (from: BookingStatus, to: BookingStatus): boolean => {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};

// Priority for display
export const getStatusPriority = (status: BookingStatus): number => {
  const priorityMap: Record<BookingStatus, number> = {
    [BookingStatus.CHECKED_IN]: 1,
    [BookingStatus.PAID]: 2,
    [BookingStatus.CONFIRMED]: 3,
    [BookingStatus.PENDING]: 4,
    [BookingStatus.CHECKED_OUT]: 5,
    [BookingStatus.COMPLETED]: 6,
    [BookingStatus.NO_SHOW]: 7,
    [BookingStatus.CANCELLED]: 8,
  };
  return priorityMap[status] ?? 99;
};
