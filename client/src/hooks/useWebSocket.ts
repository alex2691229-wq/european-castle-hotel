import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] 已連接');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('[WebSocket] 收到消息:', message);
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('[WebSocket] 解析消息失敗:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] 連接關閉');
        setIsConnected(false);
        
        // 5 秒後自動重連
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('[WebSocket] 嘗試重新連接...');
          connect();
        }, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] 連接錯誤:', error);
      };
    } catch (error) {
      console.error('[WebSocket] 創建連接失敗:', error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { isConnected };
}
