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
  status: "pending" | "confirmed" | "paid_pending" | "paid" | "completed" | "cancelled";
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
        status: "paid_pending",
        roomTypeName: "標準雙床房",
        createdAt: new Date("2026-01-10"),
      },
    ];

    // 模擬付款數據
    const mockPayments: Record<number, PaymentInfo> = {
      120028: {
        bookingId: 120028,
        paymentMethod: "bank_transfer",
        paymentStatus: "pending",
        amount: 3560,
        bankName: "台灣銀行",
        accountNumber: "028001003295",
        accountName: "歐堡商務汽車旅館",
        transferReference: "TRF20260110001",
        transferDate: new Date("2026-01-12"),
        lastFiveDigits: "03295",
        notes: "客戶已轉帳，待確認",
      },
    };

    setBookings(mockBookings);
    setPayments(mockPayments);
    setLoading(false);
  }, [user]);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus as any } : b
      ));

      const statusMessages: Record<string, string> = {
        confirmed: "✓ 訂房已確認，確認郵件已發送給客戶",
        paid_pending: "💳 已標記為已匯款，等待款項確認",
        paid: "✅ 已確認付款，訂房完成確認",
        completed: "🎉 訂房已完成",
      };

      alert(statusMessages[newStatus] || "狀態已更新");
    } catch (error) {
      alert("更新狀態失敗");
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("確定要取消此訂房嗎？")) return;

    try {
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: "cancelled" as const } : b
      ));

      alert("訂房已取消，取消通知已發送給客戶");
    } catch (error) {
      alert("取消訂房失敗");
    }
  };

  const handleAddPayment = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    setPaymentForm({
      bookingId,
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      amount: booking ? Number(booking.totalPrice) : 0,
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = () => {
    const bookingId = paymentForm.bookingId;
    if (!bookingId) return;

    setPayments({
      ...payments,
      [bookingId]: {
        bookingId,
        paymentMethod: paymentForm.paymentMethod || "bank_transfer",
        paymentStatus: paymentForm.paymentStatus || "pending",
        amount: paymentForm.amount || 0,
        bankName: paymentForm.bankName,
        accountNumber: paymentForm.accountNumber,
        accountName: paymentForm.accountName,
        transferReference: paymentForm.transferReference,
        transferDate: paymentForm.transferDate,
        notes: paymentForm.notes,
      },
    });

    setShowPaymentModal(false);
    alert("付款詳情已保存");
  };

  const handleConfirmPayment = (bookingId: number) => {
    const payment = payments[bookingId];
    if (!payment) return;

    // 更新付款狀態為已收款
    setPayments({
      ...payments,
      [bookingId]: {
        ...payment,
        paymentStatus: "received",
        confirmedAt: new Date(),
      },
    });

    // 更新訂房狀態為已付款
    handleStatusChange(bookingId, "paid");
    alert("✅ 付款已確認，訂房狀態已更新為已付款");
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "paid_pending",
      paid_pending: "paid",
      paid: "completed",
    };
    return statusFlow[currentStatus] || null;
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "pending") return b.status === "pending";
    if (filter === "confirmed") return ["confirmed", "paid_pending", "paid"].includes(b.status);
    if (filter === "completed") return b.status === "completed";
    if (filter === "cancelled") return b.status === "cancelled";
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "⏳ 待確認" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "✓ 已確認" },
      paid_pending: { bg: "bg-orange-100", text: "text-orange-800", label: "💳 已匯款" },
      paid: { bg: "bg-green-100", text: "text-green-800", label: "✅ 已付款" },
      completed: { bg: "bg-purple-100", text: "text-purple-800", label: "🎉 已完成" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "✕ 已取消" },
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const isOverduePayment = (booking: BookingWithRoom): boolean => {
    // 檢查訂單是否超過三天未完成付款
    // 只對「待確認」、「已確認」、「已匯款」狀態的訂單檢查
    if (["paid", "completed", "cancelled"].includes(booking.status)) {
      return false;
    }

    const now = new Date();
    const createdAt = new Date(booking.createdAt);
    const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 3;
  };

  const getWarningBadge = (booking: BookingWithRoom) => {
    if (!isOverduePayment(booking)) return null;
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
        ⚠️ 超過 3 天未付款
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">訂房管理</h1>
          <p className="text-gray-600 mt-2">管理和確認客戶訂房及付款</p>
        </div>

        {/* 統計信息 */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">⏳ 待確認訂房</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {bookings.filter(b => b.status === "pending").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">✓ 已確認訂房</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {bookings.filter(b => ["confirmed", "paid_pending", "paid"].includes(b.status)).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">✅ 已付款訂房</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {bookings.filter(b => b.status === "paid").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">💰 已確認收款</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              NT$ {bookings.filter(b => b.status === "paid" || b.status === "completed").reduce((sum, b) => sum + Number(b.totalPrice), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 篩選標籤 */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(status => {
            let count = 0;
            if (status === "all") count = bookings.length;
            else if (status === "pending") count = bookings.filter(b => b.status === "pending").length;
            else if (status === "confirmed") count = bookings.filter(b => ["confirmed", "paid_pending", "paid"].includes(b.status)).length;
            else if (status === "completed") count = bookings.filter(b => b.status === "completed").length;
            else if (status === "cancelled") count = bookings.filter(b => b.status === "cancelled").length;

            return (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status === "all" ? "全部" : status === "pending" ? "⏳ 待確認" : status === "confirmed" ? "✓ 已確認" : status === "completed" ? "🎉 已完成" : "✕ 已取消"}
                <span className="ml-2 text-sm">({count})</span>
              </button>
            );
          })}
        </div>

        {/* 訂房卡片列表 */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              沒有找到符合條件的訂房
            </div>
          ) : (
            filteredBookings.map(booking => {
              const payment = payments[booking.id];
              const isExpanded = expandedBooking === booking.id;

              return (
                <div key={booking.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                  {/* 訂單卡片頭部 - 點擊展開 */}
                  <div
                    onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                    className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-gray-900">
                            #{booking.id} - {booking.guestName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {format(booking.checkInDate, "yyyy/MM/dd", { locale: zhTW })} → {format(booking.checkOutDate, "yyyy/MM/dd", { locale: zhTW })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            NT$ {Number(booking.totalPrice).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {booking.numberOfGuests} 人 • {booking.roomTypeName}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      {getWarningBadge(booking)}
                      <div className="text-gray-400 text-xl">
                        {isExpanded ? "▼" : "▶"}
                      </div>
                    </div>
                  </div>

                  {/* 展開的詳細內容 */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 space-y-6">
                      {/* 客戶信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">客戶信息</h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">姓名：</span>
                              <span className="font-medium">{booking.guestName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">電話：</span>
                              <span className="font-medium">{booking.guestPhone}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">郵件：</span>
                              <span className="font-medium break-all">{booking.guestEmail || "未提供"}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">人數：</span>
                              <span className="font-medium">{booking.numberOfGuests} 人</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">訂房信息</h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">房型：</span>
                              <span className="font-medium">{booking.roomTypeName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">入住：</span>
                              <span className="font-medium">{format(booking.checkInDate, "yyyy/MM/dd", { locale: zhTW })}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">退房：</span>
                              <span className="font-medium">{format(booking.checkOutDate, "yyyy/MM/dd", { locale: zhTW })}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">晚數：</span>
                              <span className="font-medium">
                                {Math.ceil((booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / (1000 * 60 * 60 * 24))} 晚
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 特殊需求 */}
                      {booking.specialRequests && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">特殊需求</h3>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                            {booking.specialRequests}
                          </p>
                        </div>
                      )}

                      {/* 付款信息 */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">付款信息</h3>
                        {payment ? (
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">付款方式：</span>
                              <span className="font-medium">
                                {payment.paymentMethod === "bank_transfer" ? "🏦 銀行轉帳" : "💳 信用卡"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">金額：</span>
                              <span className="font-medium">NT$ {payment.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">狀態：</span>
                              <span className={`font-medium ${payment.paymentStatus === "received" ? "text-green-600" : "text-orange-600"}`}>
                                {payment.paymentStatus === "received" ? "✅ 已收款" : "⏳ 待確認"}
                              </span>
                            </div>
                            {payment.bankName && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">銀行：</span>
                                <span className="font-medium">{payment.bankName}</span>
                              </div>
                            )}
                            {payment.accountNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">帳號：</span>
                                <span className="font-medium">{payment.accountNumber}</span>
                              </div>
                            )}
                            {payment.lastFiveDigits && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">後五碼：</span>
                                <span className="font-mono font-bold text-lg tracking-widest">{payment.lastFiveDigits}</span>
                              </div>
                            )}
                            {payment.transferDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">轉帳日期：</span>
                                <span className="font-medium">{format(payment.transferDate, "yyyy/MM/dd", { locale: zhTW })}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-red-50 p-4 rounded-lg text-red-700 text-sm">
                            ❌ 尚未添加付款信息
                          </div>
                        )}
                      </div>

                      {/* 後五碼填寫區（僅在已匯款狀態顯示） */}
                      {booking.status === "paid_pending" && payment && !payment.lastFiveDigits && (
                        <div className="border-t border-gray-200 pt-6 bg-orange-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">⚠️ 請確認後五碼</h3>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="輸入後五碼"
                              value={lastFiveDigits[booking.id] || ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                                setLastFiveDigits({ ...lastFiveDigits, [booking.id]: value });
                                setLastFiveDigitsError({ ...lastFiveDigitsError, [booking.id]: "" });
                              }}
                              className="flex-1 px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono tracking-widest"
                            />
                            <button
                              onClick={() => {
                                const digits = lastFiveDigits[booking.id];
                                if (!digits || digits.length !== 5) {
                                  setLastFiveDigitsError({ ...lastFiveDigitsError, [booking.id]: "請輸入 5 個數字" });
                                  return;
                                }
                                setPayments({
                                  ...payments,
                                  [booking.id]: {
                                    ...payment,
                                    lastFiveDigits: digits,
                                  },
                                });
                                setLastFiveDigits({ ...lastFiveDigits, [booking.id]: "" });
                                alert("✅ 後五碼已確認");
                              }}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                            >
                              ✓ 確認
                            </button>
                          </div>
                          {lastFiveDigitsError[booking.id] && (
                            <div className="text-red-600 text-sm mt-2">{lastFiveDigitsError[booking.id]}</div>
                          )}
                        </div>
                      )}

                      {/* 操作按鈕 */}
                      <div className="border-t border-gray-200 pt-6 flex gap-2 flex-wrap">
                        {booking.status !== "completed" && booking.status !== "cancelled" && (
                          <>
                            {getNextStatus(booking.status) && (
                              <button
                                onClick={() => handleStatusChange(booking.id, getNextStatus(booking.status)!)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                              >
                                ➜ 下一步
                              </button>
                            )}
                            {booking.status === "paid_pending" && payment && (
                              <button
                                onClick={() => handleConfirmPayment(booking.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                              >
                                ✓ 確認付款
                              </button>
                            )}
                            {!payment && (booking.status === "pending" || booking.status === "confirmed" || booking.status === "paid_pending") && (
                              <button
                                onClick={() => handleAddPayment(booking.id)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                              >
                                + 添加付款
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                              ✕ 取消
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 付款詳情模態框 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">添加付款詳情</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">付款方式</label>
                <select
                  value={paymentForm.paymentMethod || "bank_transfer"}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">🏦 銀行轉帳</option>
                  <option value="credit_card">💳 信用卡</option>
                  <option value="ecpay">🟢 綠界 ECPay</option>
                </select>
              </div>

              {paymentForm.paymentMethod === "bank_transfer" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">銀行名稱</label>
                    <input
                      type="text"
                      value={paymentForm.bankName || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                      placeholder="例：台灣銀行"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
                    <input
                      type="text"
                      value={paymentForm.accountNumber || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                      placeholder="例：123-456-789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">帳戶名</label>
                    <input
                      type="text"
                      value={paymentForm.accountName || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                      placeholder="例：歐堡商務汽車旅館"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">轉帳參考號</label>
                    <input
                      type="text"
                      value={paymentForm.transferReference || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transferReference: e.target.value })}
                      placeholder="例：TRF20260110001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">轉帳後五碼</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={paymentForm.lastFiveDigits || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                        setPaymentForm({ ...paymentForm, lastFiveDigits: value });
                      }}
                      placeholder="例：12345"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">轉帳日期</label>
                    <input
                      type="date"
                      value={paymentForm.transferDate ? format(paymentForm.transferDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transferDate: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 (NT$)</label>
                <input
                  type="number"
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <textarea
                  value={paymentForm.notes || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="例：客戶已轉帳，待確認"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSavePayment}
                disabled={paymentForm.paymentMethod === "bank_transfer" && !paymentForm.lastFiveDigits}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {paymentForm.paymentMethod === "bank_transfer" && !paymentForm.lastFiveDigits ? "請填寫後五碼" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
