'use client';

import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface BookingWithRoom {
  id: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number | string;
  specialRequests: string | null;
  status: "pending" | "confirmed" | "pending_payment" | "paid" | "cash_on_site" | "completed" | "cancelled";
  roomTypeName: string;
  createdAt: Date;
}

interface PaymentInfo {
  bookingId: number;
  paymentMethod: "bank_transfer" | "credit_card" | "ecpay" | "cash_on_site";
  paymentStatus: "pending" | "received" | "failed" | "refunded";
  amount: number;
  lastFiveDigits?: string;
}

export default function AdminBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [payments, setPayments] = useState<Record<number, PaymentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "pending_payment" | "paid" | "cash_on_site" | "completed" | "check_in_today" | "check_out_today">("all");
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastFiveDigits, setLastFiveDigits] = useState<Record<number, string>>({});
  const [lastFiveDigitsError, setLastFiveDigitsError] = useState<Record<number, string>>({});
  
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // 模擬數據
    const mockBookings: BookingWithRoom[] = [];
    
    // 生成144筆待確認訂單
    for (let i = 0; i < 144; i++) {
      mockBookings.push({
        id: 120200 - i,
        guestName: `客戶 ${i + 1}`,
        guestEmail: `guest${i + 1}@example.com`,
        guestPhone: `090012345${i % 10}`,
        checkInDate: new Date(2026, 0, 15 + Math.floor(i / 20)),
        checkOutDate: new Date(2026, 0, 17 + Math.floor(i / 20)),
        numberOfGuests: 2,
        totalPrice: 3560 + (i % 5) * 500,
        specialRequests: null,
        status: "pending",
        roomTypeName: "標準雙床房",
        createdAt: new Date(),
      });
    }

    // 添加其他狀態的訂單
    mockBookings.push({
      id: 120050,
      guestName: "已確認客戶",
      guestEmail: "confirmed@example.com",
      guestPhone: "0900123456",
      checkInDate: new Date(2026, 0, 20),
      checkOutDate: new Date(2026, 0, 22),
      numberOfGuests: 2,
      totalPrice: 3560,
      specialRequests: null,
      status: "confirmed",
      roomTypeName: "標準雙床房",
      createdAt: new Date(),
    });

    mockBookings.push({
      id: 120049,
      guestName: "待付款客戶",
      guestEmail: "pending@example.com",
      guestPhone: "0900654321",
      checkInDate: new Date(2026, 0, 25),
      checkOutDate: new Date(2026, 0, 27),
      numberOfGuests: 3,
      totalPrice: 5340,
      specialRequests: null,
      status: "pending_payment",
      roomTypeName: "舒適三人房",
      createdAt: new Date(),
    });

    setBookings(mockBookings);
    setLoading(false);
  }, [user]);

  const handleStatusChange = (bookingId: number, newStatus: string) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus as any } : booking
      )
    );
  };

  const handlePaymentMethodSelection = (bookingId: number, method: "bank_transfer" | "cash_on_site") => {
    if (method === "cash_on_site") {
      // 現場付款：直接進入現場付款狀態
      setPayments({
        ...payments,
        [bookingId]: {
          bookingId,
          paymentMethod: "cash_on_site",
          paymentStatus: "pending",
          amount: Number(bookings.find(b => b.id === bookingId)?.totalPrice) || 0,
        },
      });
      handleStatusChange(bookingId, "cash_on_site");
    } else {
      // 銀行轉帳：設置付款方式，等待填寫後五碼
      setPayments({
        ...payments,
        [bookingId]: {
          bookingId,
          paymentMethod: "bank_transfer",
          paymentStatus: "pending",
          amount: Number(bookings.find(b => b.id === bookingId)?.totalPrice) || 0,
        },
      });
      // 保持在 pending_payment 狀態，等待填寫後五碼
    }
  };

  const handleLastFiveDigits = (bookingId: number, lastFive: string) => {
    if (!/^\d{5}$/.test(lastFive)) {
      setLastFiveDigitsError({
        ...lastFiveDigitsError,
        [bookingId]: "後五碼必須是5個數字",
      });
      return;
    }

    setPayments({
      ...payments,
      [bookingId]: {
        ...payments[bookingId],
        lastFiveDigits: lastFive,
        paymentStatus: "received",
      },
    });

    handleStatusChange(bookingId, "paid");
    setLastFiveDigits({ ...lastFiveDigits, [bookingId]: "" });
    setLastFiveDigitsError({ ...lastFiveDigitsError, [bookingId]: "" });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string; bgColor: string }> = {
      pending: { text: "⛳ 待確認", color: "text-yellow-800", bgColor: "bg-yellow-100" },
      confirmed: { text: "✓ 已確認", color: "text-blue-800", bgColor: "bg-blue-100" },
      pending_payment: { text: "💳 待付款", color: "text-orange-800", bgColor: "bg-orange-100" },
      paid: { text: "✅ 已付款", color: "text-green-800", bgColor: "bg-green-100" },
      cash_on_site: { text: "🏨 現場付款", color: "text-purple-800", bgColor: "bg-purple-100" },
      completed: { text: "🎉 已完成", color: "text-indigo-800", bgColor: "bg-indigo-100" },
      cancelled: { text: "✗ 已取消", color: "text-red-800", bgColor: "bg-red-100" },
    };
    return badges[status] || badges.pending;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    if (filter === "check_in_today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    }
    if (filter === "check_out_today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkOutDate = new Date(booking.checkOutDate);
      checkOutDate.setHours(0, 0, 0, 0);
      return checkOutDate.getTime() === today.getTime();
    }
    return booking.status === filter;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending_payment: bookings.filter(b => b.status === "pending_payment").length,
    paid: bookings.filter(b => b.status === "paid").length,
    cash_on_site: bookings.filter(b => b.status === "cash_on_site").length,
    check_in_today: bookings.filter(b => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(b.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    }).length,
    check_out_today: bookings.filter(b => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkOutDate = new Date(b.checkOutDate);
      checkOutDate.setHours(0, 0, 0, 0);
      return checkOutDate.getTime() === today.getTime();
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">訂單管理 - 防呆流程</h1>

        {/* 快速篩選按鈕 */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: "all", label: "總訂單數", color: "bg-gray-700", count: statusCounts.all },
            { key: "pending", label: "待確認", color: "bg-yellow-600", count: statusCounts.pending },
            { key: "confirmed", label: "已確認", color: "bg-blue-600", count: statusCounts.confirmed },
            { key: "check_in_today", label: "當日入住名單", color: "bg-red-600", count: statusCounts.check_in_today },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setFilter(s.key as any);
                setCurrentPage(1);
              }}
              className={`p-6 rounded-lg transition font-bold text-center text-lg ${
                filter === s.key ? "ring-4 ring-yellow-400 " + s.color : s.color + " hover:opacity-80"
              }`}
            >
              <div className="text-5xl font-bold mb-2">{s.count}</div>
              <div className="text-base">{s.label}</div>
            </button>
          ))}
        </div>

        {/* 狀態統計框 */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-8 gap-4">
          {[
            { key: "all", label: "全部", color: "bg-gray-700", count: statusCounts.all },
            { key: "pending", label: "待確認", color: "bg-yellow-600", count: statusCounts.pending },
            { key: "confirmed", label: "已確認", color: "bg-blue-600", count: statusCounts.confirmed },
            { key: "pending_payment", label: "待付款", color: "bg-orange-600", count: statusCounts.pending_payment },
            { key: "paid", label: "已付款", color: "bg-green-600", count: statusCounts.paid },
            { key: "cash_on_site", label: "現場付款", color: "bg-purple-600", count: statusCounts.cash_on_site },
            { key: "check_in_today", label: "📥 入住名單", color: "bg-red-600", count: statusCounts.check_in_today },
            { key: "check_out_today", label: "📤 出房名單", color: "bg-pink-600", count: statusCounts.check_out_today },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setFilter(s.key as any);
                setCurrentPage(1);
              }}
              className={`p-4 rounded-lg transition font-medium text-center ${
                filter === s.key ? "ring-2 ring-yellow-400 " + s.color : s.color + " hover:opacity-80"
              }`}
            >
              <div className="text-3xl font-bold">{s.count}</div>
              <div className="text-sm mt-1">{s.label}</div>
            </button>
          ))}
        </div>

        {/* 訂單列表標題 */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">訂單列表 ({filteredBookings.length})</h2>
          <div className="text-gray-400">第 {currentPage} 頁，共 {totalPages} 頁</div>
        </div>

        {/* 訂單列表 */}
        <div className="space-y-6 mb-8">
          {paginatedBookings.length > 0 ? (
            paginatedBookings.map((booking) => {
              const payment = payments[booking.id];
              const isExpanded = expandedBooking === booking.id;
              const badge = getStatusBadge(booking.status);

              return (
                <div
                  key={booking.id}
                  className="bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 hover:border-gray-600 transition cursor-pointer"
                  onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                >
                  {/* 訂單摘要 */}
                  <div className="p-6 flex items-center justify-between bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.bgColor} ${badge.color}`}>
                          {badge.text}
                        </span>
                        <h3 className="text-2xl font-bold">{booking.guestName}</h3>
                        <span className="text-gray-400">訂單 #{booking.id}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">入住日期</span>
                          <p className="text-lg font-medium">{format(new Date(booking.checkInDate), "yyyy/M/d", { locale: zhTW })}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">退房日期</span>
                          <p className="text-lg font-medium">{format(new Date(booking.checkOutDate), "yyyy/M/d", { locale: zhTW })}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">房型</span>
                          <p className="text-lg font-medium">{booking.roomTypeName}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">金額</span>
                          <p className="text-lg font-medium text-yellow-400">NT${typeof booking.totalPrice === 'string' ? booking.totalPrice : booking.totalPrice}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-3xl">{isExpanded ? "▼" : "▶"}</div>
                  </div>

                  {/* 詳細信息和操作 */}
                  {isExpanded && (
                    <div className="bg-gray-900 p-6 border-t border-gray-700">
                      {/* 客戶信息 */}
                      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <h4 className="text-lg font-bold mb-4 text-blue-300">📋 客戶信息</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-400">電話</span>
                            <p className="text-white font-medium">{booking.guestPhone}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">郵箱</span>
                            <p className="text-white font-medium">{booking.guestEmail || "未提供"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">客人數</span>
                            <p className="text-white font-medium">{booking.numberOfGuests} 人</p>
                          </div>
                          <div>
                            <span className="text-gray-400">特殊要求</span>
                            <p className="text-white font-medium">{booking.specialRequests || "無"}</p>
                          </div>
                        </div>
                      </div>

                      {/* 流程步驟 */}
                      <div className="mb-6 space-y-4">
                        {/* 步驟1: 待確認 */}
                        {booking.status === "pending" && (
                          <div className="p-4 bg-yellow-900 border-2 border-yellow-600 rounded-lg">
                            <h4 className="text-lg font-bold mb-4 text-yellow-300">📌 步驟1: 確認訂房</h4>
                            <p className="text-yellow-100 mb-4">請確認客戶訂房信息，然後點擊下方「✓ 確認訂房」按鈕</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(booking.id, "pending_payment");
                              }}
                              className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition"
                            >
                              ✓ 確認訂房
                            </button>
                          </div>
                        )}



                        {/* 步驅2: 待付款 - 選擇付款方式 */}
                        {booking.status === "pending_payment" && !payments[booking.id] && (
                          <div className="p-4 bg-orange-900 border-2 border-orange-600 rounded-lg">
                            <h4 className="text-lg font-bold mb-4 text-orange-300">💳 步驟2: 選擇付款方式</h4>
                            <p className="text-orange-100 mb-4">請選擇客戶的付款方式</p>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentMethodSelection(booking.id, "bank_transfer");
                                }}
                                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
                              >
                                🏦 銀行轉帳
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentMethodSelection(booking.id, "cash_on_site");
                                }}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                              >
                                💰 現場付款
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 步驅3: 銀行轉帳 - 填寫後五碼 */}
                        {booking.status === "pending_payment" && payments[booking.id]?.paymentMethod === "bank_transfer" && (
                          <div className="p-4 bg-green-900 border-2 border-green-600 rounded-lg">
                            <h4 className="text-lg font-bold mb-4 text-green-300">🏪 步驟3: 銀行轉帳 - 填寫後五碼</h4>
                            <p className="text-green-100 mb-4">客戶已轉帳，請填寫轉帳單據的後五碼進行驗證</p>
                            <div className="flex gap-3 mb-4">
                              <input
                                type="text"
                                maxLength={5}
                                placeholder="輸入後五碼（5個數字）"
                                value={lastFiveDigits[booking.id] || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                                  setLastFiveDigits({ ...lastFiveDigits, [booking.id]: value });
                                  if (lastFiveDigitsError[booking.id]) {
                                    setLastFiveDigitsError({ ...lastFiveDigitsError, [booking.id]: "" });
                                  }
                                }}
                                className="flex-1 px-4 py-3 bg-black/60 border-2 border-green-600 rounded-lg text-white placeholder-gray-500 text-lg font-bold"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLastFiveDigits(booking.id, lastFiveDigits[booking.id] || "");
                                }}
                                disabled={!lastFiveDigits[booking.id] || lastFiveDigits[booking.id].length !== 5}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
                              >
                                ✓ 驗證
                              </button>
                            </div>
                            {lastFiveDigitsError[booking.id] && (
                              <p className="text-red-400 font-bold">{lastFiveDigitsError[booking.id]}</p>
                            )}
                          </div>
                        )}

                        {/* 步驟4: 已付款 */}
                        {(booking.status === "paid" || booking.status === "cash_on_site") && (
                          <div className={`p-4 border-2 rounded-lg ${
                            booking.status === "paid" 
                              ? "bg-green-900 border-green-600" 
                              : "bg-purple-900 border-purple-600"
                          }`}>
                            <h4 className={`text-lg font-bold mb-4 ${
                              booking.status === "paid" 
                                ? "text-green-300" 
                                : "text-purple-300"
                            }`}>
                              {booking.status === "paid" ? "✅ 步驟4: 已付款" : "🏨 步驟4: 現場付款"}
                            </h4>
                            <p className={`mb-4 ${
                              booking.status === "paid" 
                                ? "text-green-100" 
                                : "text-purple-100"
                            }`}>
                              {booking.status === "paid" 
                                ? `客戶已完成銀行轉帳（後五碼：${payment?.lastFiveDigits}）` 
                                : "客戶將在現場進行付款"}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(booking.id, "completed");
                              }}
                              className={`w-full px-6 py-3 text-white font-bold rounded-lg transition ${
                                booking.status === "paid" 
                                  ? "bg-green-600 hover:bg-green-700" 
                                  : "bg-purple-600 hover:bg-purple-700"
                              }`}
                            >
                              ✓ 標記入住
                            </button>
                          </div>
                        )}

                        {/* 步驟5: 已完成 */}
                        {booking.status === "completed" && (
                          <div className="p-4 bg-indigo-900 border-2 border-indigo-600 rounded-lg">
                            <h4 className="text-lg font-bold mb-4 text-indigo-300">🎉 步驟5: 已完成</h4>
                            <p className="text-indigo-100">訂房流程已完成，客戶已入住</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
            >
              ← 上一頁
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === pageNum
                        ? "bg-yellow-500 text-black font-medium"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
            >
              下一頁 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
