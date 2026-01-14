// WebSocket 事件類型定義
export interface RoomAvailabilityEvent {
  type: 'room_availability_changed';
  roomTypeId: number;
  date: string;
  bookedQuantity: number;
  maxSalesQuantity: number;
  timestamp: string;
}

export interface BookingEvent {
  type: 'booking_created' | 'booking_cancelled' | 'booking_deleted' | 'booking_status_changed';
  bookingId: number;
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  timestamp: string;
}

export interface ConnectedEvent {
  type: 'connected';
  message: string;
  timestamp: string;
}

export type WebSocketEvent = RoomAvailabilityEvent | BookingEvent | ConnectedEvent;

// 事件回調類型
export type EventCallback = (event: WebSocketEvent) => void;

/**
 * WebSocket 連接管理器
 */
class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 秒
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isManualClose = false;

  constructor() {
    // 根據當前協議決定 WebSocket 協議
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  /**
   * 連接到 WebSocket 伺服器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[WebSocket] 正在連接到', this.url);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] 連接成功');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketEvent;
            console.log('[WebSocket] 收到事件:', data.type);
            this.emit(data.type, data);
          } catch (error) {
            console.error('[WebSocket] 解析消息失敗:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] 連接錯誤:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] 連接已關閉');
          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] 連接失敗:', error);
        reject(error);
      }
    });
  }

  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocket] 將在 ${this.reconnectDelay}ms 後進行第 ${this.reconnectAttempts} 次重新連接`
      );
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[WebSocket] 重新連接失敗:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('[WebSocket] 達到最大重新連接次數，放棄連接');
    }
  }

  /**
   * 訂閱事件
   */
  on(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  /**
   * 取消訂閱事件
   */
  off(eventType: string, callback: EventCallback): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(callback);
    }
  }

  /**
   * 發送事件給所有監聽器
   */
  private emit(eventType: string, event: WebSocketEvent): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('[WebSocket] 事件回調執行失敗:', error);
        }
      });
    }
  }

  /**
   * 發送消息到伺服器
   */
  send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] WebSocket 未連接，無法發送消息');
    }
  }

  /**
   * 斷開連接
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    console.log('[WebSocket] 已斷開連接');
  }

  /**
   * 獲取連接狀態
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 導出單例
export const wsManager = new WebSocketManager();
