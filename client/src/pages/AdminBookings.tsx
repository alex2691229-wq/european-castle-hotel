import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Clock, MapPin, Phone, Mail, Trash2, Eye, ArrowRight } from "lucide-react";

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
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentInfo>>({});
  const [lastFiveDigits, setLastFiveDigits] = useState<Record<number, string>>({});
  const [lastFiveDigitsError, setLastFiveDigitsError] = useState<Record<number, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ action: string; bookingId: number } | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);

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

    setBookings(mockBookings);
    setLoading(false);
  }, [user]);

  const handleStatusChange = (bookingId: number, newStatus: string) => {
    setShowConfirmDialog({ action: `status_${newStatus}`, bookingId });
  };

  const confirmStatusChange = () => {
    if (!showConfirmDialog) return;

    const newStatus = showConfirmDialog.action.replace("status_", "");
    setBookings(
      bookings.map(b =>
        b.id === showConfirmDialog.bookingId ? { ...b, status: newStatus as any } : b
      )
    );
    setShowConfirmDialog(null);
  };

  const handleCancelBooking = (bookingId: number) => {
    setShowConfirmDialog({ action: "cancel", bookingId });
  };

  const confirmCancelBooking = () => {
    if (!showConfirmDialog) return;

    setBookings(
      bookings.map(b =>
        b.id === showConfirmDialog.bookingId ? { ...b, status: "cancelled" } : b
      )
    );
    setShowConfirmDialog(null);
  };

  const handleAddPayment = (bookingId: number) => {
    setSelectedBooking(bookingId);
    setShowPaymentModal(true);
  };

  const handleSavePayment = () => {
    if (!selectedBooking) return;

    setPayments({
      ...payments,
      [selectedBooking]: {
        bookingId: selectedBooking,
        paymentMethod: paymentForm.paymentMethod || "bank_transfer",
        paymentStatus: "pending",
        amount: bookings.find(b => b.id === selectedBooking)?.totalPrice as number,
        ...paymentForm,
      },
    });

    setShowPaymentModal(false);
    setPaymentForm({});
    setSelectedBooking(null);
  };

  const handleConfirmPayment = (bookingId: number) => {
    if (!lastFiveDigits[bookingId]) {
      setLastFiveDigitsError({ ...lastFiveDigitsError, [bookingId]: "請填寫後五碼" });
      return;
    }

    if (!/^\d{5}$/.test(lastFiveDigits[bookingId])) {
      setLastFiveDigitsError({ ...lastFiveDigitsError, [bookingId]: "後五碼必須是 5 個數字" });
      return;
    }

    setPayments({
      ...payments,
      [bookingId]: {
        ...payments[bookingId],
        paymentStatus: "received",
        lastFiveDigits: lastFiveDigits[bookingId],
        confirmedAt: new Date(),
      },
    });

    // 更新訂房狀態為已付款
    setBookings(
      bookings.map(b =>
        b.id === bookingId ? { ...b, status: "paid" } : b
      )
    );

    setLastFiveDigits({ ...lastFiveDigits, [bookingId]: "" });
    setLastFiveDigitsError({ ...lastFiveDigitsError, [bookingId]: "" });
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

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
      pending: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "待確認", icon: "🔴" },
      confirmed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "已確認", icon: "✓" },
      paid_pending: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "已匯款", icon: "⏳" },
      paid: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "已付款", icon: "✅" },
      completed: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "已完成", icon: "🎉" },
      cancelled: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "已取消", icon: "✕" },
    };
    return statusMap[status] || statusMap.pending;
  };

  const isOverduePayment = (booking: BookingWithRoom): boolean => {
    if (["paid", "completed", "cancelled"].includes(booking.status)) {
      return false;
    }

    const now = new Date();
    const createdAt = new Date(booking.createdAt);
    const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 3;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">訂房管理</h1>
          <p className="text-gray-600 mt-2">管理和確認客戶訂房及付款</p>
        </div>

        {/* 統計信息 */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500 hover:shadow-md transition">
            <div className="text-gray-600 text-sm font-medium">🔴 待確認訂房</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {bookings.filter(b => b.status === "pending").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition">
            <div className="text-gray-600 text-sm font-medium">✓ 已確認訂房</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {bookings.filter(b => ["confirmed", "paid_pending", "paid"].includes(b.status)).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500 hover:shadow-md transition">
            <div className="text-gray-600 text-sm font-medium">✅ 已付款訂房</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {bookings.filter(b => b.status === "paid").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500 hover:shadow-md transition">
            <div className="text-gray-600 text-sm font-medium">💰 已確認收款</div>
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
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status === "all" ? "全部" : status === "pending" ? "🔴 待確認" : status === "confirmed" ? "✓ 已確認" : status === "completed" ? "🎉 已完成" : "✕ 已取消"}
                <span className="ml-2 text-sm">({count})</span>
              </button>
            );
          })}
        </div>

        {/* 訂房卡片列表 */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm text-center text-gray-500">
              沒有找到符合條件的訂房
            </div>
          ) : (
            filteredBookings.map(booking => {
              const payment = payments[booking.id];
              const statusConfig = getStatusConfig(booking.status);
              const isOverdue = isOverduePayment(booking);
              const isExpanded = expandedBooking === booking.id;

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition border-l-4 ${statusConfig.border}`}
                >
                  <div className="p-6">
                    {/* 頂部：訂房編號、狀態、警告 */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">#{booking.id}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                              ⚠️ 超期未付款
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">訂房時間</div>
                        <div className="text-sm font-medium text-gray-900">{format(booking.createdAt, "MM/dd HH:mm")}</div>
                      </div>
                    </div>

                    {/* 中部：客戶信息和房間信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 pb-4 border-b border-gray-100">
                      {/* 左側：客戶信息 */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">客戶名稱</p>
                          <p className="text-lg font-semibold text-gray-900">{booking.guestName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">電話</p>
                            <p className="text-sm text-gray-900">{booking.guestPhone}</p>
                          </div>
                        </div>
                        {booking.guestEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500 font-medium">郵箱</p>
                              <p className="text-sm text-gray-900 truncate">{booking.guestEmail}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 右側：房間和日期信息 */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">房型</p>
                          <p className="text-lg font-semibold text-gray-900">{booking.roomTypeName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">入住</p>
                            <p className="text-sm font-medium text-gray-900">{format(booking.checkInDate, "MM/dd")}</p>
                            <p className="text-xs text-gray-500">{format(booking.checkInDate, "EEEE", { locale: zhTW })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">退房</p>
                            <p className="text-sm font-medium text-gray-900">{format(booking.checkOutDate, "MM/dd")}</p>
                            <p className="text-xs text-gray-500">{format(booking.checkOutDate, "EEEE", { locale: zhTW })}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 下部：價格和付款信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-1">住宿天數</p>
                        <p className="text-lg font-bold text-gray-900">
                          {Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} 晚
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-1">人數</p>
                        <p className="text-lg font-bold text-gray-900">{booking.numberOfGuests} 人</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium mb-1">總金額</p>
                        <p className="text-lg font-bold text-blue-700">NT$ {Number(booking.totalPrice).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* 付款信息和後五碼填寫 */}
                    {payment && booking.status === "paid_pending" && (
                      <div className="mb-4 pb-4 border-b border-gray-100 bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm font-bold text-orange-900 mb-1">
                              🏦 銀行轉帳 - 待確認
                            </p>
                            <p className="text-xs text-orange-700">
                              客戶已匯款，請確認後五碼以完成付款
                            </p>
                          </div>
                        </div>

                        {/* 後五碼填寫區 */}
                        <div className="bg-white p-4 rounded-lg border-2 border-orange-300">
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                請輸入轉帳後五碼
                              </label>
                              <input
                                type="text"
                                placeholder="例：12345"
                                maxLength={5}
                                value={lastFiveDigits[booking.id] || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  setLastFiveDigits({ ...lastFiveDigits, [booking.id]: value });
                                  setLastFiveDigitsError({ ...lastFiveDigitsError, [booking.id]: "" });
                                }}
                                className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg text-lg font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              inputMode="numeric"
                              />
                              {lastFiveDigitsError[booking.id] && (
                                <p className="text-sm text-red-600 mt-2 font-medium">
                                  ❌ {lastFiveDigitsError[booking.id]}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleConfirmPayment(booking.id)}
                              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-bold shadow-lg flex items-center gap-2 whitespace-nowrap"
                            >
                              ✓ 確認付款
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {payment && booking.status === "paid" && (
                      <div className="mb-4 pb-4 border-b border-gray-100 bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5" />
                              付款已確認
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              後五碼: {payment.lastFiveDigits} • 確認時間: {payment.confirmedAt ? format(payment.confirmedAt, "MM/dd HH:mm") : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!payment && booking.status !== "pending" && (
                      <div className="mb-4 pb-4 border-b border-gray-100 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-900 font-medium">
                          ⚠️ 尚未添加付款詳情，請點擊下方「添加付款」按鈕
                        </p>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 flex-wrap">
                      {/* 主操作按鈕 */}
                      {booking.status !== "completed" && booking.status !== "cancelled" && (
                        <>
                          {booking.status === "pending" && (
                            <button
                              onClick={() => handleStatusChange(booking.id, "confirmed")}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition text-sm font-bold shadow-lg flex items-center gap-2"
                            >
                              ✓ 確認訂房
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}

                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => handleStatusChange(booking.id, "paid_pending")}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-sm font-bold shadow-lg flex items-center gap-2"
                            >
                              💳 標記已匯款
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}

                          {booking.status === "paid" && (
                            <button
                              onClick={() => handleStatusChange(booking.id, "completed")}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition text-sm font-bold shadow-lg flex items-center gap-2"
                            >
                              🎉 完成訂房
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}

                          {!payment && booking.status !== "pending" && (
                            <button
                              onClick={() => handleAddPayment(booking.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold shadow-lg"
                            >
                              + 添加付款
                            </button>
                          )}
                        </>
                      )}

                      {/* 次操作按鈕 */}
                      <button
                        onClick={() => {
                          const paymentInfo = payment ? `\n\n付款方式：${payment.paymentMethod === "bank_transfer" ? "銀行轉帳" : "信用卡"}\n金額：NT$ ${payment.amount}\n狀態：${payment.paymentStatus === "received" ? "已收款" : "待確認"}\n銀行：${payment.bankName}\n帳號：${payment.accountNumber}\n帳戶名：${payment.accountName}` : "\n\n尚未添加付款詳情";
                          alert(`訂房詳情：\n\n客戶：${booking.guestName}\n電話：${booking.guestPhone}\n郵件：${booking.guestEmail}\n特殊需求：${booking.specialRequests || "無"}${paymentInfo}`);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        詳情
                      </button>

                      {/* 危險操作按鈕 */}
                      {booking.status !== "completed" && booking.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium border border-red-300 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          取消訂房
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 確認對話框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">確認操作</h2>
            </div>

            <p className="text-gray-600 mb-6">
              {showConfirmDialog.action === "cancel"
                ? "確定要取消此訂房嗎？此操作無法撤銷。"
                : `確定要將訂房狀態更改為「${
                    showConfirmDialog.action === "status_confirmed"
                      ? "已確認"
                      : showConfirmDialog.action === "status_paid_pending"
                      ? "已匯款"
                      : showConfirmDialog.action === "status_paid"
                      ? "已付款"
                      : "已完成"
                  }」嗎？`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (showConfirmDialog.action === "cancel") {
                    confirmCancelBooking();
                  } else {
                    confirmStatusChange();
                  }
                }}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition font-bold ${
                  showConfirmDialog.action === "cancel"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 付款詳情模態框 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">添加付款詳情</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">付款方式</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">銀行名稱</label>
                    <input
                      type="text"
                      value={paymentForm.bankName || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                      placeholder="例：台灣銀行"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">帳號</label>
                    <input
                      type="text"
                      value={paymentForm.accountNumber || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                      placeholder="例：123-456-789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">帳戶名</label>
                    <input
                      type="text"
                      value={paymentForm.accountName || ""}
                      onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                      placeholder="例：歐堡商務汽車旅館"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({});
                    setSelectedBooking(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSavePayment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
