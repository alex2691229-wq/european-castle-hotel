'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';

export default function TrackBooking() {
  const [bookingId, setBookingId] = useState('');
  const [phone, setPhone] = useState('');
  const [trackingResults, setTrackingResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrackBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !phone) {
      alert('請輸入訂單 ID 和電話');
      return;
    }
    
    setLoading(true);
    try {
      // TODO: Call trackBooking API when available
      console.log('Tracking booking:', { bookingId, phone });
      // const result = await trpc.booking.trackBooking.query({ bookingId, phone });
      // setTrackingResults(result);
      alert('追蹤功能後懶懶年也會提供。目前請抵達整理');
    } catch (error) {
      alert('追蹤失敗，請稍串');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gold mb-8 text-center">
          追蹤訂單
        </h1>
        
        <form onSubmit={handleTrackBooking} className="max-w-md mx-auto bg-card p-6 rounded-lg">
          <div className="mb-4">
            <label className="block text-white mb-2">訂單 ID</label>
            <input
              type="text"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="e.g., #360002"
              className="w-full px-4 py-2 bg-input text-white rounded"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-2">電話號碼</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 0912345678"
              className="w-full px-4 py-2 bg-input text-white rounded"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gold text-dark font-bold rounded hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {loading ? '查詢中...' : '查詢訂單'}
          </button>
        </form>

        {trackingResults && (
          <div className="mt-8 max-w-md mx-auto bg-card p-6 rounded-lg text-white">
            <h2 className="text-xl font-bold mb-4">訂單詳息</h2>
            <pre>{JSON.stringify(trackingResults, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
