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
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const statusMessages: Record<string, string> = {
      confirmed: "✓ 訂房已確認，確認郵件已發送給客戶",
      paid_pending: "💳 已標記為已匯款，等待款項確認",
      paid: "✅ 已確認付款，訂房完成確認",
      completed: "🎉 訂房已完成",
    };

    setBookings(bookings.map(b =>
      b.id === bookingId ? { ...b, status: newStatus as any } : b
    ));
    alert(statusMessages[newStatus] || "訂房狀態已更新");
  };

  const handleAddPayment = (bookingId: number) => {
    setPaymentForm({ bookingId, paymentMethod: "bank_transfer", paymentStatus: "pending", amount: 0 });
    setShowPaymentModal(true);
  };

  const handleCancelBooking = (bookingId: number) => {
    setBookings(bookings.map(b =>
      b.id === bookingId ? { ...b, status: "cancelled" } : b
    ));
    alert("訂房已取消，取消通知已發送給客戶");
  };

  const handleConfirmPayment = (bookingId: number) => {
    const lastFive = lastFiveDigits[bookingId];
    if (!lastFive || lastFive.length !== 5) {
      setLastFiveDigitsError({ ...lastFiveDigitsError, [bookingId]: "請填寫有效的後五碼" });
      return;
    }

    const payment = payments[bookingId];
    if (payment) {
      setPayments({
        ...payments,
        [bookingId]: {
          ...payment,
          lastFiveDigits: lastFive,
          paymentStatus: "received",
          confirmedAt: new Date(),
        },
      });
    }

    alert("✅ 付款已確認，訂房狀態已更新為已付款");
    handleStatusChange(bookingId, "paid");
    setLastFiveDigits({ ...lastFiveDigits, [bookingId]: "" });
  };

  const handleSavePayment = async () => {
    if (!paymentForm.bookingId) return;

    const newPayment: PaymentInfo = {
      bookingId: paymentForm.bookingId,
      paymentMethod: (paymentForm.paymentMethod || "bank_transfer") as any,
      paymentStatus: "pending",
      amount: paymentForm.amount || 0,
      bankName: paymentForm.bankName,
      accountNumber: paymentForm.accountNumber,
      accountName: paymentForm.accountName,
      notes: paymentForm.notes,
    };

    setPayments({ ...payments, [paymentForm.bookingId]: newPayment });
    setShowPaymentModal(false);
    setPaymentForm({});
    alert("付款詳情已保存");
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

  const getButtonLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      pending: "✓ 確認訂房",
      confirmed: "💳 標記已匯款",
      paid_pending: "✓ 確認付款",
      paid: "🎉 完成訂房",
    };
    return labels[currentStatus] || "➜ 下一步";
  };

  const getButtonColor = (currentStatus: string): string => {
    const colors: Record<string, string> = {
      pending: "bg-blue-600 hover:bg-blue-700",
      confirmed: "bg-orange-600 hover:bg-orange-700",
      paid_pending: "bg-green-600 hover:bg-green-700",
      paid: "bg-purple-600 hover:bg-purple-700",
    };
    return colors[currentStatus] || "bg-gray-600 hover:bg-gray-700";
  };

  const isOverduePayment = (booking: BookingWithRoom): boolean => {
    const statusesToCheck = ["pending", "confirmed", "paid_pending"];
    if (!statusesToCheck.includes(booking.status)) return false;

    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 3;
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
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "⏳ 待確認" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "✓ 已確認" },
      paid_pending: { bg: "bg-orange-100", text: "text-orange-800", label: "💳 已匯款" },
      paid: { bg: "bg-green-100", text: "text-green-800", label: "✅ 已付款" },
      completed: { bg: "bg-purple-100", text: "text-purple-800", label: "🎉 已完成" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "✕ 已取消" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-gray-600 mt-2">管理和確認客戶訂房及付款</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">⏳ 待確認訂房</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{bookings.filter(b => b.status === "pending").length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">✓ 已確認訂房</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{bookings.filter(b => b.status === "confirmed").length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">💰 已確認收款</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{bookings.filter(b => b.status === "paid").length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">🎉 已完成訂房</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{bookings.filter(b => b.status === "completed").length}</div>
          </div>
        </div>

        {/* 篩選和搜尋 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "全部" : s === "pending" ? "⏳ 待確認" : s === "confirmed" ? "✓ 已確認" : s === "completed" ? "🎉 已完成" : "✕ 已取消"}
              </button>
            ))}
          </div>
        </div>

        {/* 訂單列表 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">加載中...</div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600">沒有找到符合條件的訂單</div>
            </div>
          ) : (
            filteredBookings.map(booking => {
              const payment = payments[booking.id];
              const isExpanded = expandedBooking === booking.id;
              const isOverdue = isOverduePayment(booking);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                >
                  {/* 訂單卡片頭部 */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(booking.status)}
                          {isOverdue && (
                            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              ⚠️ 超過 3 天未付款
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{booking.guestName}</h3>
                        <p className="text-sm text-gray-600">訂單 #{booking.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">NT$ {Number(booking.totalPrice).toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{Math.ceil((booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / (1000 * 60 * 60 * 24))} 晚</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <span>{format(booking.checkInDate, "yyyy/MM/dd", { locale: zhTW })} → {format(booking.checkOutDate, "yyyy/MM/dd", { locale: zhTW })}</span>
                    </div>
                  </div>

                  {/* 展開詳情 */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50 space-y-6">
                      {/* 客戶信息 */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">客戶信息</h3>
                        <div className="space-y-2 text-sm">
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

                      {/* 訂房信息 */}
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
                          <div className="bg-white p-4 rounded-lg space-y-3">
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

                        {/* 後五碼填寫區（僅在已匯款狀態顯示） */}
                        {booking.status === "paid_pending" && payment && !payment.lastFiveDigits && (
                          <div className="mt-4 bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">⚠️ 請確認後五碼</h3>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={lastFiveDigits[booking.id] || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                                  setLastFiveDigits({ ...lastFiveDigits, [booking.id]: value });
                                  setLastFiveDigitsError({ ...lastFiveDigitsError, [booking.id]: "" });
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
                      </div>

                      {/* 操作按鈕 */}
                      <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-3">
                        {booking.status !== "completed" && booking.status !== "cancelled" && (
                          <>
                            {getNextStatus(booking.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(booking.id, getNextStatus(booking.status)!);
                                }}
                                className={`px-4 py-2 text-white rounded-lg transition font-medium ${getButtonColor(booking.status)}`}
                              >
                                {getButtonLabel(booking.status)}
                              </button>
                            )}
                            {!payment && (booking.status === "pending" || booking.status === "confirmed") && (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">轉帳後五碼</label>
                    <input
                      type="text"
                      value={paymentForm.lastFiveDigits || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                        setPaymentForm({ ...paymentForm, lastFiveDigits: value });
                      }}
                      placeholder="例：12345"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <input
                  type="number"
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  placeholder="例：5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <textarea
                  value={paymentForm.notes || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="例：客戶已轉帳，待確認"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentForm({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSavePayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
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
