import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function CancelBooking() {
  const [, navigate] = useLocation();
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [guestPhone, setGuestPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('bookingId');
    if (id) {
      setBookingId(parseInt(id, 10));
    }
  }, []);

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError('');
      toast.success('訂單已成功取消');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    },
    onError: (error) => {
      setError(error.message || '取消訂房失敗，請稍後重試');
      toast.error(error.message || '取消訂房失敗');
    },
  });

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingId || !guestPhone) {
      setError('請輸入訂房編號和電話號碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 取消訂房
      await cancelMutation.mutateAsync({ id: bookingId, phone: guestPhone });
    } catch (err: any) {
      // 錯誤已在 onError 中處理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">取消訂單</h1>
            <p className="text-gray-300">歐堡商務汽車旅館</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {success ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">取消成功</h2>
                <p className="text-gray-600 mb-4">
                  您的訂房 #{bookingId} 已成功取消。
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  系統將在 3 秒後返回首頁...
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded transition"
                >
                  立即返回首頁
                </button>
              </div>
            ) : (
              <form onSubmit={handleCancel}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-bold mb-2">
                    訂房編號 *
                  </label>
                  <input
                    type="number"
                    value={bookingId || ''}
                    onChange={(e) => setBookingId(e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="請輸入訂房編號"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-yellow-500"
disabled={!bookingId}                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-bold mb-2">
                    電話號碼 *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="請輸入訂房時使用的電話號碼"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-yellow-500"
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    為了安全起見，我們需要驗證您的身份
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>⚠️ 注意：</strong> 取消訂房後無法復原，請確認後再進行操作。
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition"
                >
                  {loading ? '處理中...' : '確認取消訂房'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full mt-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
                >
                  返回首頁
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-600">
            <p>如有任何問題，請聯絡我們</p>
            <p className="mt-1">
              📞 06-635-9577 | 📧 castle6359577@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
