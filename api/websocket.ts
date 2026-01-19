// @ts-nocheck
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// 事件類型定義
export interface RoomAvailabilityEvent {
  type: 'room_availability_changed';
  roomTypeId: number;
  date: string;
  bookedQuantity: number;
  maxSalesQuantity: number;
}

export interface BookingEvent {
  type: 'booking_created' | 'booking_cancelled' | 'booking_deleted' | 'booking_status_changed';
  bookingId: number;
  roomTypeId: number;
  checkInDate?: string;
  checkOutDate?: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
}

export interface BookingStatusChangedEvent {
  type: 'booking_status_changed';
  bookingId: number;
  roomTypeId: number;
  oldStatus: string;
  newStatus: string;
  checkInDate: string;
  checkOutDate: string;
}

export type WebSocketEvent = RoomAvailabilityEvent | BookingEvent | BookingStatusChangedEvent;

// WebSocket 伺服器管理器
class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * 初始化 WebSocket 伺服器
   */
  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] 新客戶端連接');
      this.clients.add(ws);

      // 發送歡迎消息
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket 連接成功',
        timestamp: new Date().toISOString(),
      }));

      // 處理客戶端消息
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          console.log('[WebSocket] 收到客戶端消息:', message);
          
          // 可以在這裡處理客戶端的訂閱請求等
          if (message.type === 'subscribe') {
            ws.send(JSON.stringify({
              type: 'subscribed',
              channel: message.channel,
              timestamp: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.error('[WebSocket] 解析消息失敗:', error);
        }
      });

      // 處理客戶端斷開連接
      ws.on('close', () => {
        console.log('[WebSocket] 客戶端斷開連接');
        this.clients.delete(ws);
      });

      // 處理錯誤
      ws.on('error', (error: Error) => {
        console.error('[WebSocket] 客戶端錯誤:', error);
        this.clients.delete(ws);
      });
    });

    console.log('[WebSocket] 伺服器已初始化');
  }

  /**
   * 廣播事件給所有客戶端
   */
  broadcast(event: WebSocketEvent): void {
    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });

    console.log('[WebSocket] 廣播事件:', event.type);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * 發送事件給特定客戶端
   */
  sendToClient(client: WebSocket, event: WebSocketEvent): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  /**
   * 獲取連接的客戶端數量
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 關閉 WebSocket 伺服器
   */
  close() {
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
      console.log('[WebSocket] 伺服器已關閉');
    }
  }
}

// 導出單例
export const wsManager = new WebSocketManager();
