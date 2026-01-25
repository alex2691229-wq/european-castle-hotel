// @ts-nocheck
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Mail,
  Trash2,
  DollarSign,
  User,
  Phone,
  Calendar,
  CreditCard,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BookingManagementOptimized() {
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const { data: roomTypes } = trpc.roomTypes.list.useQuery();
  const utils = trpc.useUtils();

  // 狀態管理
  const [currentPage, setCurrentPage] = useState(1);
  const [quickFilter, setQuickFilter] = useState<
    "all" | "pending" | "confirmed" | "pending_payment" | "today_checkin"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(
    null
  );
  const [bankTransferDialogOpen, setBankTransferDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null
  );
  const [lastFiveDigits, setLastFiveDigits] = useState("");

  const itemsPerPage = 10;

  // Mutations
  const deleteBookingMutation = trpc.bookings.deleteBooking.useMutation({
    onSuccess: () => {
      toast.success("訂單已刪除");
      utils.bookings.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const confirmBookingMutation = trpc.bookings.confirmBooking.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success("訂房已確認");
    },
    onError: (error) => {
      toast.error(`確認失敗：${error.message}`);
    },
  });

  const markCheckedInMutation = trpc.bookings.markCheckedIn.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success("已標記入住");
    },
    onError: (error) => {
      toast.error(`標記失敗：${error.message}`);
    },
  });

  const sendEmailMutation = trpc.bookings.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("郵件已發送");
    },
    onError: (error) => {
      toast.error(`發送失敗：${error.message}`);
    },
  });

  const selectPaymentMethodMutation =
    trpc.bookings.selectPaymentMethod.useMutation({
      onSuccess: async () => {
        await utils.bookings.list.invalidate();
        toast.success("支付方式已選擇");
      },
      onError: (error) => {
        toast.error(`選擇失敗：${error.message}`);
      },
    });

  const confirmBankTransferMutation =
    trpc.bookings.confirmBankTransfer.useMutation({
      onSuccess: async () => {
        await utils.bookings.list.invalidate();
        setBankTransferDialogOpen(false);
        setLastFiveDigits("");
        toast.success("銀行轉帳已確認");
      },
      onError: (error) => {
        toast.error(`確認失敗：${error.message}`);
      },
    });

  // 計算統計數據
  const stats = useMemo(() => {
    if (!bookings) return { total: 0, pending: 0, confirmed: 0, urgent: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: bookings.length,
      pending: bookings.filter((b: any) => b.status === "pending").length,
      confirmed: bookings.filter((b: any) => b.status === "confirmed").length,
      urgent: bookings.filter((b: any) => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        const daysUntil = Math.floor(
          (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil >= 0 && daysUntil <= 3;
      }).length,
    };
  }, [bookings]);

  // 處理快速篩選
  const handleQuickFilter = (filter: typeof quickFilter) => {
    setQuickFilter(filter);
    setCurrentPage(1);
  };

  // 篩選訂單
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    let result = bookings;

    // 快速篩選
    if (quickFilter === "pending") {
      result = result.filter((b: any) => b.status === "pending");
    } else if (quickFilter === "confirmed") {
      result = result.filter((b: any) => b.status === "confirmed");
    } else if (quickFilter === "pending_payment") {
      result = result.filter((b: any) => b.status === "pending_payment");
    } else if (quickFilter === "today_checkin") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter((b: any) => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      });
    }

    // 搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b: any) =>
          b.id.toString().includes(query) ||
          b.guestName.toLowerCase().includes(query) ||
          b.guestPhone?.toLowerCase().includes(query) ||
          b.guestEmail?.toLowerCase().includes(query)
      );
    }

    // 狀態篩選
    if (statusFilter !== "all") {
      result = result.filter((b: any) => b.status === statusFilter);
    }

    // 日期篩選
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "urgent") {
        result = result.filter((b: any) => {
          const checkIn = new Date(b.checkInDate);
          checkIn.setHours(0, 0, 0, 0);
          const daysUntil = Math.floor(
            (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil >= 0 && daysUntil <= 3;
        });
      } else if (dateFilter === "week") {
        result = result.filter((b: any) => {
          const checkIn = new Date(b.checkInDate);
          checkIn.setHours(0, 0, 0, 0);
          const daysUntil = Math.floor(
            (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil >= 0 && daysUntil <= 7;
        });
      } else if (dateFilter === "month") {
        result = result.filter((b: any) => {
          const checkIn = new Date(b.checkInDate);
          checkIn.setHours(0, 0, 0, 0);
          const daysUntil = Math.floor(
            (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil >= 0 && daysUntil <= 30;
        });
      }
    }

    // 房型篩選
    if (roomTypeFilter !== "all") {
      result = result.filter(
        (b: any) => b.roomTypeId === parseInt(roomTypeFilter)
      );
    }

    return result;
  }, [bookings, quickFilter, searchQuery, statusFilter, dateFilter, roomTypeFilter]);

  // 分頁
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 獲取房型名稱
  const getRoomTypeName = (roomTypeId: number) => {
    return roomTypes?.find((r: any) => r.id === roomTypeId)?.name || "未知房型";
  };

  // 獲取狀態徽章
  const getStatusBadge = (status: string, isUrgent: boolean) => {
    const badges: Record<
      string,
      { label: string; bg: string; text: string; icon: any }
    > = {
      pending: {
        label: "待確認",
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
      },
      confirmed: {
        label: "已確認",
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      pending_payment: {
        label: "待付款",
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: CreditCard,
      },
      paid: {
        label: "已付款",
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: CheckCircle,
      },
      cash_on_site: {
        label: "現場支付",
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: DollarSign,
      },
      checked_in: {
        label: "已入住",
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        icon: CheckCircle,
      },
      cancelled: {
        label: "已取消",
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
      },
    };

    const badge = badges[status] || badges.pending;
    if (isUrgent && status !== "cancelled") {
      return {
        ...badge,
        label: "🔴 " + badge.label,
      };
    }
    return badge;
  };

  return (
    <div className="space-y-6">
      {/* 快速篩選按鈕 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => handleQuickFilter("all")}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === "all"
              ? "bg-blue-900 border-blue-500 text-white"
              : "bg-card border-border hover:border-blue-500"
          }`}
        >
          <p className="text-sm text-muted-foreground">全部訂單</p>
          <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
        </button>
        <button
          onClick={() => handleQuickFilter("pending")}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === "pending"
              ? "bg-yellow-900 border-yellow-500 text-white"
              : "bg-card border-border hover:border-yellow-500"
          }`}
        >
          <p className="text-sm text-muted-foreground">待確認</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </button>
        <button
          onClick={() => handleQuickFilter("confirmed")}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === "confirmed"
              ? "bg-green-900 border-green-500 text-white"
              : "bg-card border-border hover:border-green-500"
          }`}
        >
          <p className="text-sm text-muted-foreground">已確認</p>
          <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
        </button>
        <button
          onClick={() => handleQuickFilter("pending_payment")}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === "pending_payment"
              ? "bg-orange-900 border-orange-500 text-white"
              : "bg-card border-border hover:border-orange-500"
          }`}
        >
          <p className="text-sm text-muted-foreground">待付款</p>
          <p className="text-2xl font-bold text-orange-400">
            {filteredBookings.filter((b: any) => b.status === "pending_payment")
              .length}
          </p>
        </button>
        <button
          onClick={() => handleQuickFilter("today_checkin")}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === "today_checkin"
              ? "bg-purple-900 border-purple-500 text-white"
              : "bg-card border-border hover:border-purple-500"
          }`}
        >
          <p className="text-sm text-muted-foreground">今日入住</p>
          <p className="text-2xl font-bold text-purple-400">
            {
              filteredBookings.filter((b: any) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkIn = new Date(b.checkInDate);
                checkIn.setHours(0, 0, 0, 0);
                return checkIn.getTime() === today.getTime();
              }).length
            }
          </p>
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">總訂單數</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">待確認</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">已確認</p>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">緊急訂單</p>
          <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
        </Card>
      </div>

      {/* 搜尋和篩選 */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          搜尋和篩選
        </h3>
        <div className="space-y-4">
          <Input
            placeholder="搜尋訂單號、客戶名、電話或郵箱..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-background border-border text-foreground"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="按狀態篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="pending_payment">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="cash_on_site">現場支付</SelectItem>
                <SelectItem value="checked_in">已入住</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="按日期篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有日期</SelectItem>
                <SelectItem value="urgent">緊急（3天內入住）</SelectItem>
                <SelectItem value="week">本週入住</SelectItem>
                <SelectItem value="month">本月入住</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={roomTypeFilter}
              onValueChange={(value) => {
                setRoomTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="按房型篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有房型</SelectItem>
                {roomTypes &&
                  roomTypes.map((room: any) => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 訂單列表 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          訂單列表 ({filteredBookings.length})
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : paginatedBookings.length > 0 ? (
          <div className="space-y-4">
            {paginatedBookings.map((booking: any) => {
              // 計算距離入住日期的天數
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkInDate = new Date(booking.checkInDate);
              checkInDate.setHours(0, 0, 0, 0);
              const daysUntilCheckIn = Math.ceil(
                (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              const statusBadge = getStatusBadge(
                booking.status,
                booking.isUrgent
              );
              const StatusIcon = statusBadge.icon;
              const roomTypeName = getRoomTypeName(booking.roomTypeId);

              return (
                <div
                  key={booking.id}
                  className={`p-5 rounded-lg border-2 transition-all ${
                    booking.isUrgent
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : "border-border bg-card hover:shadow-lg"
                  }`}
                >
                  {/* 頂部：狀態、訂單號、客戶名 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 whitespace-nowrap ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {StatusIcon && <StatusIcon size={14} />}
                        {statusBadge.label}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {booking.guestName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          訂單 #{booking.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        NT${booking.totalPrice || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysUntilCheckIn >= 0
                          ? daysUntilCheckIn === 0
                            ? "今天入住"
                            : `${daysUntilCheckIn}天後入住`
                          : "已過期"}
                      </p>
                    </div>
                  </div>

                  {/* 主要信息：房型、日期、人數 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-border">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground text-xs mt-0.5">
                        🏠
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">房型</p>
                        <p className="text-sm font-medium text-foreground">
                          {roomTypeName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">入住</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(booking.checkInDate).toLocaleDateString(
                            "zh-TW"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">退房</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(booking.checkOutDate).toLocaleDateString(
                            "zh-TW"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User size={14} className="text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">人數</p>
                        <p className="text-sm font-medium text-foreground">
                          {booking.numberOfGuests || 2} 人
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 聯絡信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-muted-foreground" />
                      <p className="text-sm text-foreground">
                        {booking.guestPhone || "未提供"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-muted-foreground" />
                      <p className="text-sm text-foreground truncate">
                        {booking.guestEmail || "未提供"}
                      </p>
                    </div>
                    {booking.paymentMethod && (
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-muted-foreground" />
                        <p className="text-sm text-foreground">
                          {booking.paymentMethod === "bank_transfer"
                            ? "🏦 銀行轉帳"
                            : "💵 現場支付"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 快速操作按鈕 */}
                  <div className="flex flex-wrap gap-2">
                    {booking.status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          if (
                            confirm("確定要確認這個訂房嗎？")
                          ) {
                            confirmBookingMutation.mutate({ id: booking.id });
                          }
                        }}
                        disabled={confirmBookingMutation.isPending}
                      >
                        {confirmBookingMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <CheckCircle size={14} className="mr-1" />
                        )}
                        確認訂房
                      </Button>
                    )}

                    {booking.status === "confirmed" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => {
                            if (confirm("確定選擇銀行轉帳支付方式嗎？")) {
                              selectPaymentMethodMutation.mutate({
                                id: booking.id,
                                method: "bank_transfer",
                              });
                            }
                          }}
                          disabled={selectPaymentMethodMutation.isPending}
                        >
                          🏦 銀行轉帳
                        </Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => {
                            if (confirm("確定選擇現場支付方式嗎？")) {
                              selectPaymentMethodMutation.mutate({
                                id: booking.id,
                                method: "cash_on_site",
                              });
                            }
                          }}
                          disabled={selectPaymentMethodMutation.isPending}
                        >
                          💵 現場支付
                        </Button>
                      </>
                    )}

                    {booking.status === "pending_payment" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setBankTransferDialogOpen(true);
                        }}
                      >
                        ✓ 確認銀行轉帳
                      </Button>
                    )}

                    {(booking.status === "paid" ||
                      booking.status === "cash_on_site") && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          if (confirm("確定標記為已入住嗎？")) {
                            markCheckedInMutation.mutate({ id: booking.id });
                          }
                        }}
                        disabled={markCheckedInMutation.isPending}
                      >
                        {markCheckedInMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <CheckCircle size={14} className="mr-1" />
                        )}
                        標記入住
                      </Button>
                    )}

                    {booking.status !== "checked_in" &&
                      booking.status !== "cancelled" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              sendEmailMutation.mutate({ id: booking.id });
                            }}
                            disabled={sendEmailMutation.isPending}
                          >
                            {sendEmailMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin mr-1" />
                            ) : (
                              <Mail size={14} className="mr-1" />
                            )}
                            發送郵件
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("確定要刪除這個訂單嗎？")) {
                                deleteBookingMutation.mutate({ id: booking.id });
                              }
                            }}
                            disabled={deleteBookingMutation.isPending}
                          >
                            {deleteBookingMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin mr-1" />
                            ) : (
                              <Trash2 size={14} className="mr-1" />
                            )}
                            刪除
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            沒有找到匹配的訂單
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
              disabled={currentPage === 1}
            >
              上一頁
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              下一頁
            </Button>
          </div>
        )}
      </Card>

      {/* 銀行轉帳確認對話框 */}
      {bankTransferDialogOpen && selectedBookingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 bg-card border-border max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-foreground mb-4">
              確認銀行轉帳
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              請輸入客戶銀行轉帳的後五碼
            </p>
            <Input
              type="text"
              placeholder="輸入後五碼"
              value={lastFiveDigits}
              onChange={(e) => setLastFiveDigits(e.target.value)}
              className="bg-background border-border text-foreground mb-4"
              maxLength={5}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  if (lastFiveDigits.length === 5) {
                    confirmBankTransferMutation.mutate({
                      id: selectedBookingId,
                      lastFiveDigits,
                    });
                  } else {
                    toast.error("請輸入5位數字");
                  }
                }}
                disabled={confirmBankTransferMutation.isPending}
              >
                {confirmBankTransferMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                確認
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setBankTransferDialogOpen(false);
                  setLastFiveDigits("");
                  setSelectedBookingId(null);
                }}
              >
                取消
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
