import ical from 'ical';
// @ts-nocheck
import * as db from '../db.js';

/**
 * Booking.com iCal 同步配置
 * Property ID: 1073128
 * 每 15 分鐘自動伦取 Booking.com 預訂消息
 */

const BOOKING_PROPERTY_ID = '1073128';
const BOOKING_ICAL_URL = `https://secure.booking.com/ical/${BOOKING_PROPERTY_ID}.ics`;
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 分鐘

interface BookingEvent {
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomId?: string;
  externalId: string; // Booking.com 預訂编号
}

/**
 * 自動同步定时器
 */
let syncInterval: NodeJS.Timeout | null = null;

/**
 * 启動 iCal 同步
 */
export function startBookingCalendarSync() {
  if (syncInterval) return; // 已經啟動

  console.log('[Booking.com iCal] 啟動同步定时器');
  
  // 首先执行一次
  syncBookingCalendar();
  
  // 每 15 分鐘一次
  syncInterval = setInterval(syncBookingCalendar, SYNC_INTERVAL);
}

/**
 * 停止 iCal 同步
 */
export function stopBookingCalendarSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Booking.com iCal] 已停止同步');
  }
}

/**
 * 下載並解析 Booking.com iCal feed
 */
export async function syncBookingCalendar(): Promise<void> {
  try {
    console.log('[Booking.com iCal] 開始同步...');
    
    // 下載 iCal feed
    const response = await fetch(BOOKING_ICAL_URL, {
      headers: {
        'User-Agent': 'European-Castle-Hotel/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[Booking.com iCal] HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const icsData = await response.text();
    const events = parseBookingEvents(icsData);
    
    console.log(`[Booking.com iCal] 找到 ${events.length} 個事件`);
    
    // 處理每一個預訂事件
    for (const event of events) {
      await processBookingEvent(event);
    }
    
    console.log('[Booking.com iCal] 同步完成');
  } catch (error) {
    console.error('[Booking.com iCal] 同步錯誤:', error);
  }
}

/**
 * 解析 iCal 數據
 */
function parseBookingEvents(icsData: string): BookingEvent[] {
  const events: BookingEvent[] = [];
  
  try {
    const lines = icsData.split('\n');
    let currentEvent: any = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === 'BEGIN:VEVENT') {
        currentEvent = {
          properties: {}
        };
      } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
        const event = currentEvent.properties;
        
        // 提取預訂信息
        if (event.summary && event.dtstart && event.dtend) {
          const booking: BookingEvent = {
            guestName: extractGuestName(event.summary),
            checkInDate: parseICalDate(event.dtstart),
            checkOutDate: parseICalDate(event.dtend),
            externalId: event.uid || `booking-${Date.now()}`
          };
          
          events.push(booking);
        }
        
        currentEvent = null;
      } else if (currentEvent && trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':');
        currentEvent.properties[key] = value;
      }
    }
  } catch (error) {
    console.error('[Booking.com iCal] 解析错誤:', error);
  }

  return events;
}

/**
 * 提取客人名字
 */
function extractGuestName(summary: string): string {
  // 一般格式: "Room X - Guest Name"
  const match = summary.match(/- (.+)$/);
  return match ? match[1].trim() : summary;
}

/**
 * 解析 iCal 日期格式
 */
function parseICalDate(dateStr: string): Date {
  // iCal 日期格式: "20260116T000000Z" 或 "20260116"
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  } else {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month - 1, day);
  }
}

/**
 * 處理單个預訂事件
 */
async function processBookingEvent(event: BookingEvent): Promise<void> {
  try {
    // 検查是否已經存在此預訂
    const existingBooking = await db.getBookingsByPhone(event.guestName);
    
    // 如果是新預訂，自動封鎖房間
    const isNew = !existingBooking.some(b => 
      new Date(b.checkInDate).getTime() === event.checkInDate.getTime() &&
      new Date(b.checkOutDate).getTime() === event.checkOutDate.getTime()
    );

    if (isNew) {
      console.log(`[Booking.com iCal] 新預訂: ${event.guestName} (${event.checkInDate.toLocaleDateString()} - ${event.checkOutDate.toLocaleDateString()})`);
      
      // 创建房間封鎖記錄
      // 這裡應設置所有房間類型爲已預訂
      const roomTypes = await db.getAllRoomTypes();
      for (const roomType of roomTypes) {
        await db.createRoomBlockage(roomType.id, 
          getDateRange(event.checkInDate, event.checkOutDate), 
          `Booking.com 預訂: ${event.guestName}`);
      }
    }
  } catch (error) {
    console.error(`[Booking.com iCal] 處理預訂錯誤:`, error);
  }
}

/**
 * 產生日期範團陣列
 */
function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * 手動触發同步
 */
export async function manualSyncBookingCalendar(): Promise<{ success: boolean; message: string }> {
  try {
    await syncBookingCalendar();
    return { success: true, message: 'Booking.com iCal 同步成功' };
  } catch (error) {
    return { success: false, message: `同步失敗: ${error}` };
  }
}
