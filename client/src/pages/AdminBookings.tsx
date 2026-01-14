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
    status: "pending" | "confirmed" | "pending_payment" | "paid" | "completed" | "cancelled";
    roomTypeName: string;
    createdAt: Date;
  }

interface PaymentInfo {
  bookingId: number;
  paymentMethod: "bank_transfer" | "credit_card" | "ecpay";
  paymentStatus: "pending" | "received" | "failed" | "refunded";
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferReference?: string;
  transferDate?: Date;
  confirmedAt?: Date;
  notes?: string;
  lastFiveDigits?: string;
}

export default function AdminBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [payments, setPayments] = useState<Record<number, PaymentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("pending");
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentInfo>>({});
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "week">("all");
  const [lastFiveDigits, setLastFiveDigits] = useState<Record<number, string>>({});
  const [lastFiveDigitsError, setLastFiveDigitsError] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // 模擬數據 - 實際應該從伺服器獲取
    const mockBookings: BookingWithRoom[] = [
      {
        id: 120030,
        guestName: "John Smith",
        guestEmail: "john.smith@example.com",
        guestPhone: "0900123456",
        checkInDate: new Date("2026-01-15"),
        checkOutDate: new Date("2026-01-17"),
        numberOfGuests: 2,
        totalPrice: 4360,
        specialRequests: "需要高樓層房間",
        status: "pending",
        roomTypeName: "舒適三人房",
        createdAt: new Date(),
      },
      {
        id: 120029,
        guestName: "Jane Doe",
        guestEmail: "jane.doe@example.com",
        guestPhone: "0900654321",
        checkInDate: new Date("2026-01-20"),
        checkOutDate: new Date("2026-01-23"),
        numberOfGuests: 3,
        totalPrice: 5340,
        specialRequests: null,
        status: "confirmed",
        roomTypeName: "標準雙床房 (高樓層)",
        createdAt: new Date("2026-01-12"),
      },
      {
        id: 120028,
        guestName: "Michael Chen",
        guestEmail: "michael.chen@example.com",
        guestPhone: "0912345678",
        checkInDate: new Date("2026-01-25"),
        checkOutDate: new Date("2026-01-27"),
        numberOfGuests: 2,
        totalPrice: 3560,
        specialRequests: null,
        status: "pending_payment",
        roomTypeName: "標準雙床房",
        createdAt: new Date("2026-01-10"),
      },
    ];

    const mockPayments: Record<number, PaymentInfo> = {
      120029: {
        bookingId: 120029,
        paymentMethod: "bank_transfer",
        paymentStatus: "pending",
        amount: 5340,
        bankName: "台灣銀行",
        accountNumber: "123-456-789",
        accountName: "歐堡商務汽車旅館",
        notes: "客戶已轉帳，待確認",
      },
      120028: {
        bookingId: 120028,
        paymentMethod: "bank_transfer",
        paymentStatus: "received",
        amount: 3560,
        bankName: "台灣銀行",
        accountNumber: "123-456-789",
        accountName: "歐堡商務汽車旅館",
        transferDate: new Date("2026-01-10"),
        notes: "已收款",
      },
    };

    setBookings(mockBookings);
    setPayments(mockPayments);
    setLoading(false);
  }, [user]);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    setBookings(
      bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus as any } : b
      )
    );
  };

  const handleConfirmPayment = (bookingId: number) => {
    const lastFive = lastFiveDigits[bookingId];
    if (!lastFive || lastFive.length !== 5 || !/^\d{5}$/.test(lastFive)) {
      setLastFiveDigitsError({
        ...lastFiveDigitsError,
        [bookingId]: "請填寫有效的後五碼（5 個數字）",
      });
      return;
    }

    setPayments({
      ...payments,
      [bookingId]: {
        ...payments[bookingId],
        lastFiveDigits: lastFive,
        confirmedAt: new Date(),
      },
    });

    handleStatusChange(bookingId, "paid");
    setLastFiveDigits({ ...lastFiveDigits, [bookingId]: "" });
    setLastFiveDigitsError({ ...lastFiveDigitsError, [bookingId]: "" });
  };

  const handleCancelBooking = (bookingId: number) => {
    handleStatusChange(bookingId, "cancelled");
  };

  const handleAddPayment = (bookingId: number) => {
    setPaymentForm({ bookingId });
    setShowPaymentModal(true);
  };

  const handleSavePayment = () => {
    if (paymentForm.bookingId) {
      setPayments({
        ...payments,
        [paymentForm.bookingId]: paymentForm as PaymentInfo,
      });
      setShowPaymentModal(false);
      setPaymentForm({});
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "pending_payment",  // 已確認自動進入待付款
      pending_payment: "paid",       // 填寫後五碼後才能進入已付款
      paid: "completed",
    };
    return statusFlow[currentStatus] || null;
  };

  const getButtonLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      pending: "✓ 確認訂房",
      confirmed: "✓ 確認訂房",  // 已確認狀態也顯示確認按鈕，點擊後自動進入待付款
      pending_payment: "🎉 完成訂房",  // 待付款狀態，填寫後五碼後點擊完成訂房
      paid: "✓ 標記入住",
    };
    return labels[currentStatus] || "➜ 下一步";
  };

  const getButtonColor = (currentStatus: string): string => {
    const colors: Record<string, string> = {
      pending: "bg-blue-600 hover:bg-blue-700",
      confirmed: "bg-blue-600 hover:bg-blue-700",
      pending_payment: "bg-green-600 hover:bg-green-700",
      paid: "bg-purple-600 hover:bg-purple-700",
    };
    return colors[currentStatus] || "bg-gray-600 hover:bg-gray-700";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      pending: { text: "⛳ 待確認", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { text: "✓ 已確認", color: "bg-blue-100 text-blue-800" },
      pending_payment: { text: "💳 待付款", color: "bg-orange-100 text-orange-800" },
      paid: { text: "✅ 已付款", color: "bg-green-100 text-green-800" },
      completed: { text: "🎉 已完成", color: "bg-purple-100 text-purple-800" },
      cancelled: { text: "✗ 已取消", color: "bg-red-100 text-red-800" },
    };
    const badge = badges[status] || { text: "未知", color: "bg-gray-100 text-gray-800" };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>{badge.text}</span>;
  };

  const isOverduePayment = (booking: BookingWithRoom): boolean => {
    if (booking.status === "paid" || booking.status === "completed" || booking.status === "cancelled") {
      return false;
    }
    const createdDate = new Date(booking.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 3;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter !== "all" && booking.status !== filter) return false;
    return true;
  });

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
        <h1 className="text-4xl font-bold mb-8">訂單列表 ({filteredBookings.length})</h1>

        {/* 篩選按鈕 */}
        <div className="mb-8 flex flex-wrap gap-3">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-6 py-2 rounded-lg transition font-medium ${
                filter === s ? "bg-yellow-500 text-black" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {s === "all" ? "全部" : s === "pending" ? "待確認" : s === "confirmed" ? "已確認" : s === "completed" ? "已完成" : "已取消"}
            </button>
          ))}
        </div>

        {/* 訂單列表 */}
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const payment = payments[booking.id];
            const isExpanded = expandedBooking === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
              >
                {/* 訂單摘要 */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      {getStatusBadge(booking.status)}
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
                        <span className="text-gray-400">入住人數</span>
                        <p className="text-lg font-medium">{booking.numberOfGuests} 人</p>
                      </div>
                      <div>
                        <span className="text-gray-400">總金額</span>
                        <p className="text-lg font-medium text-yellow-400">NT$ {booking.totalPrice}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl ml-4">{isExpanded ? "▼" : "▶"}</div>
                </div>

                {/* 展開詳情 */}
                {isExpanded && (
                  <div className="border-t border-gray-700 p-6 bg-gray-750">
                    {/* 客戶信息 */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold mb-4 text-yellow-400">客戶信息</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">客戶名稱</span>
                          <p className="text-lg">{booking.guestName}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">聯絡電話</span>
                          <p className="text-lg">{booking.guestPhone}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">聯絡信箱</span>
                          <p className="text-lg">{booking.guestEmail || "未提供"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">房型</span>
                          <p className="text-lg">{booking.roomTypeName}</p>
                        </div>
                      </div>
                      {booking.specialRequests && (
                        <div className="mt-4">
                          <span className="text-gray-400">特殊要求</span>
                          <p className="text-lg">{booking.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    {/* 付款信息 */}
                    {payment && (
                      <div className="mb-6">
                        <h4 className="text-lg font-bold mb-4 text-yellow-400">付款信息</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-400">付款方式</span>
                            <p className="text-lg">{payment.paymentMethod === "bank_transfer" ? "銀行轉帳" : payment.paymentMethod}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">付款金額</span>
                            <p className="text-lg text-yellow-400">NT$ {payment.amount}</p>
                          </div>
                          {payment.bankName && (
                            <>
                              <div>
                                <span className="text-gray-400">銀行名稱</span>
                                <p className="text-lg">{payment.bankName}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">帳號</span>
                                <p className="text-lg font-mono">{payment.accountNumber}</p>
                              </div>
                            </>
                          )}
                          {payment.lastFiveDigits && (
                            <div>
                              <span className="text-gray-400">後五碼</span>
                              <p className="text-lg font-mono text-green-400">{payment.lastFiveDigits}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 後五碼填寫區 */}
                    {booking.status === "pending_payment" && (
                      <div className="mb-6 p-4 bg-orange-900 border border-orange-700 rounded-lg">
                        <h4 className="text-lg font-bold mb-4 text-orange-300">💳 填寫後五碼確認付款</h4>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={lastFiveDigits[booking.id] || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                              setLastFiveDigits({ ...lastFiveDigits, [booking.id]: value });
                              if (lastFiveDigitsError[booking.id]) {
                                setLastFiveDigitsError({ ...lastFiveDigitsError, [booking.id]: "" });
                              }
                            }}
                            placeholder="輸入後五碼"
                            maxLength={5}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg tracking-widest"
                          />
                          <button
                            onClick={() => handleConfirmPayment(booking.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium whitespace-nowrap"
                          >
                            ✓ 確認
                          </button>
                        </div>
                        {lastFiveDigitsError[booking.id] && (
                          <p className="text-red-600 text-sm mt-2">{lastFiveDigitsError[booking.id]}</p>
                        )}
                      </div>
                    )}

                    {/* 超期警告 */}
                    {isOverduePayment(booking) && (
                      <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                        <p className="text-red-300 font-medium">⚠️ 超過 3 天未付款</p>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="border-t border-gray-700 pt-6 flex flex-wrap gap-3">
                      {booking.status !== "completed" && booking.status !== "cancelled" && (
                        <>
                          {(booking.status === "pending" || booking.status === "confirmed" || booking.status === "pending_payment" || booking.status === "paid") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (booking.status === "pending_payment" && !lastFiveDigits[booking.id]) {
                                  setLastFiveDigitsError({
                                    ...lastFiveDigitsError,
                                    [booking.id]: "請先填寫後五碼",
                                  });
                                  return;
                                }
                                handleStatusChange(booking.id, getNextStatus(booking.status)!);
                              }}
                              disabled={booking.status === "pending_payment" && !lastFiveDigits[booking.id]}
                              className={`px-4 py-2 text-white rounded-lg transition font-medium ${getButtonColor(booking.status)} ${booking.status === "pending_payment" && !lastFiveDigits[booking.id] ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {getButtonLabel(booking.status)}
                            </button>
                          )}
                          {booking.status === "pending" && !payment && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPayment(booking.id);
                              }}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                              💰 添加付款信息
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelBooking(booking.id);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                          >
                            ✕ 取消訂房
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 付款信息模態框 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">添加付款信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">付款方式</label>
                <select
                  value={paymentForm.paymentMethod || "bank_transfer"}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="bank_transfer">銀行轉帳</option>
                  <option value="credit_card">信用卡</option>
                  <option value="ecpay">綠界金流</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">金額</label>
                <input
                  type="number"
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">備註</label>
                <textarea
                  value={paymentForm.notes || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentForm({});
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                取消
              </button>
              <button
                onClick={handleSavePayment}
                className="flex-1 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
