'use client';

import React, { useState } from 'react';
import { trpc } from '@/utils/trpc';

interface BookingDetail {
  id: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  bankLastFive?: string;
  customerName?: string;
  customerPhone?: string;
}

export default function TrackBooking() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [lastFive, setLastFive] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // TODO: Call trackBooking API when available
      console.log('Tracking booking:', { orderId, phone });
      
      // Mock data for testing
      if (orderId && phone) {
        setBooking({
          id: orderId,
          roomName: '標準雙床房',
          checkIn: '2026-01-20',
          checkOut: '2026-01-22',
          totalPrice: 3560,
          status: 'pending',
          bankLastFive: '',
          customerName: '測試客戶',
          customerPhone: phone
        });
      } else {
        setError('請輸入訂單 ID 和手機号碼');
      }
    } catch (err) {
      setError('找不到符合條件的訂單。請確認訂單 ID 和手機是否正確');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLastFive = async () => {
    if (lastFive.length !== 5) {
      alert('請輸入正確的 5 位數字');
      return;
    }
    
    try {
      // TODO: Call API: PATCH /api/bookings/{id}/bank-info
      alert(`已送出后五码: ${lastFive}，管理冓將實快核對。`);
      setBooking(prev => prev ? { ...prev, bankLastFive: lastFive, status: 'confirmed' } : null);
      setLastFive('');
    } catch (error) {
      alert('輸入失敗，請稍並');
    }
  };

  const handleCancel = async () => {
    const confirmCancel = window.confirm('您確定要取消此画予訂吗？取消後房間將釋出。');
    
    if (confirmCancel) {
      try {
        // TODO: Call API: POST /api/bookings/{id}/cancel
        alert('訂単已成功取消');
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      } catch (error) {
        alert('取消失敗，請稍並');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark to-darker py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-gold mb-8 text-center">
          追蹤我的訂房
        </h1>

        {!booking ? (
          <form onSubmit={handleSearch} className="bg-card p-8 rounded-lg shadow-lg border border-gold/20">
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">訂單編號 (Order ID)</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="例如: #360002"
                className="w-full px-4 py-2 bg-input text-white rounded border border-gold/30 focus:outline-none focus:border-gold"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">話購人手機號碼</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="請輸入訂房時填寫的手機"
                className="w-full px-4 py-2 bg-input text-white rounded border border-gold/30 focus:outline-none focus:border-gold"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-dark font-bold rounded hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {loading ? '查詢中...' : '查詢訂單'}
            </button>
          </form>
        ) : (
          <div className="bg-card p-8 rounded-lg shadow-lg border border-gold/20">
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500 rounded">
              <h2 className="text-xl font-bold text-gold mb-2">訂單狀態</h2>
              <p className="text-white text-lg">
                {booking.status === 'pending' ? '待確認' : booking.status === 'confirmed' ? '已確認' : '已取消'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gold mb-2"># {booking.roomName}</h3>
              <p className="text-gray-300 mb-2">訂單 ID: {booking.id}</p>
              <p className="text-gray-300 mb-2">客戶姓名: {booking.customerName}</p>
              <p className="text-gray-300">的話號: {booking.customerPhone}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-input rounded">
              <div>
                <p className="text-gray-400 text-sm">入住日期</p>
                <p className="text-white font-semibold">{booking.checkIn}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">退住日期</p>
                <p className="text-white font-semibold">{booking.checkOut}</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-input rounded">
              <p className="text-gray-400 text-sm">總金額</p>
              <p className="text-white text-2xl font-bold">NT${booking.totalPrice.toLocaleString()}</p>
            </div>

            {booking.status === 'pending' && !booking.bankLastFive && (
              <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded">
                <h4 className="text-lg font-bold text-yellow-400 mb-3">填寫匯款資訊</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={lastFive}
                    onChange={(e) => setLastFive(e.target.value.replace(/\D/g, ''))}
                    placeholder="輸入銀行轉帳後五码"
                    className="flex-1 px-3 py-2 bg-input text-white rounded border border-gold/30 focus:outline-none focus:border-gold"
                  />
                  <button
                    onClick={handleUpdateLastFive}
                    className="px-6 py-2 bg-gold text-dark font-bold rounded hover:bg-yellow-500 transition"
                  >
                    送出
                  </button>
                </div>
              </div>
            )}

            {booking.bankLastFive && (
              <div className="mb-6 p-3 bg-green-500/20 border border-green-500 rounded text-green-400">
                ✓ 已回報上位码: {booking.bankLastFive}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setBooking(null); setError(''); }}
                className="flex-1 py-3 border-2 border-gold text-gold font-bold rounded hover:bg-gold/10 transition"
              >
                返回查詢
              </button>
              {booking.status !== 'cancelled' && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
                >
                  取消訂房
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
