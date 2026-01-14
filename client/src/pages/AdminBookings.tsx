'use client';

import { useState, useEffect } from 'react';

type BookingStatus = 'pending' | 'confirmed' | 'pending_payment' | 'paid' | 'cash_on_site' | 'completed' | 'cancelled';
type PaymentMethod = 'bank_transfer' | 'cash_on_site';
type FilterType = 'all' | 'pending' | 'confirmed' | 'pending_payment' | 'paid' | 'cash_on_site' | 'completed' | 'today_checkin';

interface Booking {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number;
  specialRequests: string | null;
  status: BookingStatus;
  roomTypeName: string;
  paymentMethod?: PaymentMethod;
  lastFiveDigits?: string;
  createdAt: Date;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  // 初始化模擬數據
  useEffect(() => {
    const mockBookings: Booking[] = Array.from({ length: 144 }, (_, i) => ({
      id: 180000 + i,
      guestName: `客戶 ${i + 1}`,
      guestEmail: `guest${i + 1}@example.com`,
      guestPhone: '0900123456',
      checkInDate: new Date(2026, 0, 15 + (i % 10)),
      checkOutDate: new Date(2026, 0, 17 + (i % 10)),
      numberOfGuests: 2,
      totalPrice: 3560,
      specialRequests: null,
      status: i < 143 ? 'pending' : 'confirmed',
      roomTypeName: '標準雙床房',
      createdAt: new Date(),
    }));
    setBookings(mockBookings);
  }, []);

  // 篩選訂單
  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'today_checkin') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    }
    return booking.status === filter;
  });

  // 計算分頁
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // 計算各狀態的訂單數量
  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    today_checkin: bookings.filter((b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(b.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    }).length,
  };

  // 更新訂單狀態
  const handleStatusChange = (bookingId: number, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      )
    );
  };

  // 選擇支付方式
  const handlePaymentMethodSelection = (bookingId: number, method: PaymentMethod) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              paymentMethod: method,
              status: method === 'cash_on_site' ? 'cash_on_site' : 'pending_payment',
            }
          : b
      )
    );
  };

  // 提交後五碼
  const handleSubmitLastFiveDigits = (bookingId: number, digits: string) => {
    if (!/^\d{5}$/.test(digits)) {
      alert('請輸入正確的後五碼（5個數字）');
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              lastFiveDigits: digits,
              status: 'paid',
            }
          : b
      )
    );
  };

  // 標記入住
  const handleMarkCheckedIn = (bookingId: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'completed' } : b
      )
    );
  };

  // 處理篩選按鈕點擊
  const handleFilterClick = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <h1 className="text-4xl font-bold mb-8">📋 訂單管理</h1>

        {/* 快速篩選按鈕 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => handleFilterClick('all')}
            className={`p-6 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'bg-blue-900 border-blue-500'
                : 'bg-gray-800 border-gray-700 hover:border-blue-500'
            }`}
          >
            <div className="text-sm text-gray-400">全部訂單</div>
            <div className="text-3xl font-bold text-blue-400">{statusCounts.all}</div>
          </button>

          <button
            onClick={() => handleFilterClick('pending')}
            className={`p-6 rounded-lg border-2 transition-all ${
              filter === 'pending'
                ? 'bg-yellow-900 border-yellow-500'
                : 'bg-gray-800 border-gray-700 hover:border-yellow-500'
            }`}
          >
            <div className="text-sm text-gray-400">待確認</div>
            <div className="text-3xl font-bold text-yellow-400">{statusCounts.pending}</div>
          </button>

          <button
            onClick={() => handleFilterClick('confirmed')}
            className={`p-6 rounded-lg border-2 transition-all ${
              filter === 'confirmed'
                ? 'bg-green-900 border-green-500'
                : 'bg-gray-800 border-gray-700 hover:border-green-500'
            }`}
          >
            <div className="text-sm text-gray-400">已確認</div>
            <div className="text-3xl font-bold text-green-400">{statusCounts.confirmed}</div>
          </button>

          <button
            onClick={() => handleFilterClick('today_checkin')}
            className={`p-6 rounded-lg border-2 transition-all ${
              filter === 'today_checkin'
                ? 'bg-purple-900 border-purple-500'
                : 'bg-gray-800 border-gray-700 hover:border-purple-500'
            }`}
          >
            <div className="text-sm text-gray-400">當日入住</div>
            <div className="text-3xl font-bold text-purple-400">{statusCounts.today_checkin}</div>
          </button>
        </div>

        {/* 訂單列表 */}
        <div className="space-y-4 mb-8">
          {paginatedBookings.length > 0 ? (
            paginatedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
              >
                {/* 訂單卡片頭部 */}
                <div
                  onClick={() =>
                    setExpandedBookingId(
                      expandedBookingId === booking.id ? null : booking.id
                    )
                  }
                  className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold">訂單 {booking.id}</div>
                      <div className="text-sm text-gray-400">
                        {booking.guestName} | {booking.roomTypeName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`px-3 py-1 rounded text-sm font-bold ${
                          booking.status === 'pending'
                            ? 'bg-yellow-900 text-yellow-300'
                            : booking.status === 'confirmed'
                              ? 'bg-blue-900 text-blue-300'
                              : booking.status === 'pending_payment'
                                ? 'bg-orange-900 text-orange-300'
                                : booking.status === 'paid'
                                  ? 'bg-green-900 text-green-300'
                                  : booking.status === 'cash_on_site'
                                    ? 'bg-purple-900 text-purple-300'
                                    : booking.status === 'completed'
                                      ? 'bg-indigo-900 text-indigo-300'
                                      : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {booking.status === 'pending'
                          ? '🔴 待確認'
                          : booking.status === 'confirmed'
                            ? '✓ 已確認'
                            : booking.status === 'pending_payment'
                              ? '💳 待付款'
                              : booking.status === 'paid'
                                ? '✅ 已付款'
                                : booking.status === 'cash_on_site'
                                  ? '🏨 現場付款'
                                  : booking.status === 'completed'
                                    ? '🎉 已完成'
                                    : '❌ 已取消'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 訂單詳情（展開時顯示） */}
                {expandedBookingId === booking.id && (
                  <div className="border-t border-gray-700 p-4 bg-gray-750">
                    {/* 客戶信息 */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3 text-gray-300">客戶信息</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">姓名</div>
                          <div className="text-white">{booking.guestName}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">電話</div>
                          <div className="text-white">{booking.guestPhone}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">郵箱</div>
                          <div className="text-white">{booking.guestEmail}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">人數</div>
                          <div className="text-white">{booking.numberOfGuests} 人</div>
                        </div>
                      </div>
                    </div>

                    {/* 訂單信息 */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3 text-gray-300">訂單信息</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">房型</div>
                          <div className="text-white">{booking.roomTypeName}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">入住日期</div>
                          <div className="text-white">
                            {new Date(booking.checkInDate).toLocaleDateString('zh-TW')}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">退房日期</div>
                          <div className="text-white">
                            {new Date(booking.checkOutDate).toLocaleDateString('zh-TW')}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">總價</div>
                          <div className="text-white">NT${booking.totalPrice}</div>
                        </div>
                      </div>
                    </div>

                    {/* 訂房流程步驟 */}
                    <div className="space-y-4">
                      {/* 步驟 1：待確認 */}
                      {booking.status === 'pending' && (
                        <div className="p-4 bg-yellow-900 border-2 border-yellow-600 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-yellow-300">🔴 步驟1: 待確認</h4>
                          <p className="text-yellow-100 mb-4">
                            客戶已下訂單，請確認訂房
                          </p>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            ✓ 確認訂房
                          </button>
                        </div>
                      )}

                      {/* 步驟 2：已確認 */}
                      {booking.status === 'confirmed' && (
                        <div className="p-4 bg-blue-900 border-2 border-blue-600 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-blue-300">✓ 步驟2: 已確認</h4>
                          <p className="text-blue-100 mb-4">
                            訂房已確認，現在選擇支付方式
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => handlePaymentMethodSelection(booking.id, 'bank_transfer')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                              🏦 銀行轉帳
                            </button>
                            <button
                              onClick={() => handlePaymentMethodSelection(booking.id, 'cash_on_site')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                              💵 現場支付
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 步驟 3：待付款（銀行轉帳） */}
                      {booking.status === 'pending_payment' && booking.paymentMethod === 'bank_transfer' && (
                        <div className="p-4 bg-orange-900 border-2 border-orange-600 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-orange-300">💳 步驟3: 待付款</h4>
                          <p className="text-orange-100 mb-4">
                            客戶已轉帳，請填寫後五碼以確認收款
                          </p>
                          <div className="space-y-4">
                            <input
                              type="text"
                              placeholder="輸入後五碼"
                              maxLength={5}
                              pattern="\d{5}"
                              className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.currentTarget;
                                  handleSubmitLastFiveDigits(booking.id, input.value);
                                  input.value = '';
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                handleSubmitLastFiveDigits(booking.id, input.value);
                                input.value = '';
                              }}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                              🎉 完成訂房
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 步驟 3：現場付款 */}
                      {booking.status === 'cash_on_site' && (
                        <div className="p-4 bg-purple-900 border-2 border-purple-600 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-purple-300">🏨 步驟3: 現場付款</h4>
                          <p className="text-purple-100 mb-4">
                            客戶將在入住時支付，請在客戶入住時收款
                          </p>
                          <button
                            onClick={() => handleMarkCheckedIn(booking.id)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            ✓ 標記入住
                          </button>
                        </div>
                      )}

                      {/* 步驟 4：已付款 */}
                      {booking.status === 'paid' && (
                        <div className="p-4 bg-green-900 border-2 border-green-600 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-green-300">✅ 步驟4: 已付款</h4>
                          <p className="text-green-100 mb-4">
                            後五碼：{booking.lastFiveDigits} | 訂房已完成付款
                          </p>
                          <button
                            onClick={() => handleMarkCheckedIn(booking.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            ✓ 標記入住
                          </button>
                        </div>
                      )}

                      {/* 步驟 5：已完成 */}
                      {booking.status === 'completed' && (
                        <div className="p-4 bg-indigo-900 border-2 border-indigo-600 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-indigo-300">🎉 步驟5: 已完成</h4>
                          <p className="text-indigo-100">訂房流程已完成，客戶已入住</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              沒有找到符合條件的訂單
            </div>
          )}
        </div>

        {/* 分頁導航 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              ← 上一頁
            </button>

            {/* 頁碼按鈕 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              下一頁 →
            </button>
          </div>
        )}

        {/* 分頁信息 */}
        <div className="text-center mt-4 text-gray-400">
          第 {currentPage} 頁，共 {totalPages} 頁 | 顯示 {paginatedBookings.length} / {filteredBookings.length} 筆訂單
        </div>
      </div>
    </div>
  );
}
