'use client';

import { useState } from 'react';
import { Search, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrackingModal({ isOpen, onClose }: TrackingModalProps) {
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim() || !orderId.trim()) {
      setMessage({ type: 'error', text: '請填寫所有欄位' });
      return;
    }

    if (!/^09\d{8}$/.test(phone)) {
      setMessage({ type: 'error', text: '電話號碼格式不正確（應為 09xxxxxxxx）' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    console.log('Tracking Query:', {
      phone,
      orderId,
      timestamp: new Date().toISOString(),
      action: 'BOOKING_TRACK_SEARCH',
    });

    try {
    // Call the actual API to fetch booking information
    const result = await fetchBookingFromAuditLogs(phone, orderId);

    if (result) {
      setMessage({
        type: 'success',
        text: `✓ 訂單 #{orderId} 已找到！狀態：待確認 (客戶電話：${phone})`,
      });
    } else {
      setMessage({
        type: 'error',
        text: '查詢失敗：無法在系統中找到該訂單記錄，請確認訂單編號和電話號碼是否正確',
      });
    }
  } catch (error) {
    console.error('Tracking error:', error);
    setMessage({
      type: 'error',
      text: '系統錯誤：查詢過程中發生了問題，請稍後再試',
    });
  } finally {
    setIsLoading(false);
  }
  };

    // Helper function to fetch booking information from audit logs API
  const fetchBookingFromAuditLogs = async (
    phone: string,
    orderId: string
  ): Promise<any | null> => {
    try {
      // Make API call to the backend trackBooking endpoint
      const response = await fetch('/api/routers/bookings/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim(),
          orderId: orderId.trim(),
        }),
      });

      if (!response.ok) {
        console.warn('API returned error status:', response.status);
        return null;
      }

      const booking = await response.json();
      return booking && booking.id ? booking : null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">追蹤訂房</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              📱 電話號碼
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXX"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🏷️ 訂單編號
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="例如：#360002"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm flex items-center gap-2">
              <div className="animate-spin">⏳</div>
              系統正在比對 <strong>{orderId}</strong> 中...
            </div>
          )}

          {message && !isLoading && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? '查詢中...' : '🔍 開始查詢'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
