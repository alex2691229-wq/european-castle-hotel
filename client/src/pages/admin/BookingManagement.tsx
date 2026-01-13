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
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock, Mail, CheckSquare, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function BookingManagement() {
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  
  // 快速操作 mutations
  const deleteBookingMutation = trpc.bookings.deleteBooking.useMutation({
    onSuccess: () => {
      toast.success("訂單已删除");
      utils.bookings.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除失敗");
    },
  });
  
  const confirmBookingMutation = trpc.bookings.confirmBooking.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success('訂房已確認');
    },
    onError: (error) => {
      toast.error(`確認失敗：${error.message}`);
    },
  });
  
  const markCheckedInMutation = trpc.bookings.markCheckedIn.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success('已標記入住');
    },
    onError: (error) => {
      toast.error(`標記失敗：${error.message}`);
    },
  });
  
  const sendEmailMutation = trpc.bookings.sendEmail.useMutation({
    onSuccess: () => {
      toast.success('郵件已發送');
    },
    onError: (error) => {
      toast.error(`發送失敗：${error.message}`);
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  
  // 獲取房型列表用於篩選
  const { data: roomTypes } = trpc.roomTypes.list.useQuery();

  // 計算倒計時和驗證數據
  const processedBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.map((booking: any) => {
      const checkInDate = new Date(booking.checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkInDate.setHours(0, 0, 0, 0);

      const daysUntilCheckIn = Math.ceil(
        (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 驗證數據
      const hasErrors = {
        noEmail: !booking.guestEmail,
        noPhone: !booking.guestPhone,
        invalidDates:
          new Date(booking.checkInDate) >= new Date(booking.checkOutDate),
      };

      return {
        ...booking,
        daysUntilCheckIn,
        hasErrors,
        isUrgent: daysUntilCheckIn <= 3 && daysUntilCheckIn >= 0,
      };
    });
  }, [bookings]);

  // 篩選和搜尋
  const filteredBookings = useMemo(() => {
    return processedBookings.filter((booking: any) => {
      // 搜尋過濾 - 添加 null 檢查
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (booking.guestName?.toLowerCase()?.includes(searchLower) || false) ||
        (booking.guestPhone?.includes(searchQuery) || false) ||
        (booking.guestEmail?.toLowerCase()?.includes(searchLower) || false) ||
        (booking.id?.toString()?.includes(searchQuery) || false);

      if (!matchesSearch) return false;

      // 狀態過濾
      if (statusFilter !== "all" && booking.status !== statusFilter)
        return false;

      // 日期過濾
      if (dateFilter === "urgent" && !booking.isUrgent) return false;
      if (dateFilter === "week" && booking.daysUntilCheckIn > 7) return false;
      if (dateFilter === "month" && booking.daysUntilCheckIn > 30) return false;
      
      // 房型過濾
      if (roomTypeFilter !== "all" && booking.roomTypeId !== parseInt(roomTypeFilter)) return false;

      return true;
    });
  }, [processedBookings, searchQuery, statusFilter, dateFilter, roomTypeFilter]);

  // 統計數據
  const stats = useMemo(() => {
    return {
      total: processedBookings.length,
      pending: processedBookings.filter((b: any) => b.status === "pending")
        .length,
      confirmed: processedBookings.filter((b: any) => b.status === "confirmed")
        .length,
      urgent: processedBookings.filter((b: any) => b.isUrgent).length,
    };
  }, [processedBookings]);

  // 狀態標籤配置
  const getStatusBadge = (status: string, isUrgent: boolean) => {
    if (isUrgent) {
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "🔴 待確認",
        icon: AlertCircle,
      };
    }

    switch (status) {
      case "confirmed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "✓ 已確認",
          icon: CheckCircle,
        };
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "⏳ 待確認",
          icon: Clock,
        };
      case "cancelled":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "✗ 已取消",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "未知",
          icon: null,
        };
    }
  };

  return (
    <div className="space-y-6">
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background border-border text-foreground"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="按狀態篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
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
            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="按房型篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有房型</SelectItem>
                {roomTypes && roomTypes.map((room: any) => (
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
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-3">
            {filteredBookings.map((booking: any) => {
              const statusBadge = getStatusBadge(
                booking.status,
                booking.isUrgent
              );
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={booking.id}
                  className={`p-6 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${
                    booking.isUrgent
                      ? "border-red-500 bg-red-50"
                      : "border-border bg-card"
                  }`}
                  onClick={() => setLocation(`/admin/bookings/${booking.id}`)}
                >
                  {/* 頂部：狀態和訂單號 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {StatusIcon && <StatusIcon size={14} />}
                        {statusBadge.label}
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {booking.guestName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        訂單 #{booking.id}
                      </p>
                      {booking.daysUntilCheckIn >= 0 && (
                        <p className="text-xs text-muted-foreground">
                          {booking.daysUntilCheckIn === 0
                            ? "今天入住"
                            : `${booking.daysUntilCheckIn}天後入住`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 錯誤警告 */}
                  {(booking.hasErrors.noEmail ||
                    booking.hasErrors.noPhone ||
                    booking.hasErrors.invalidDates) && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start gap-2">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      <div>
                        {booking.hasErrors.noEmail && (
                          <p>⚠️ 缺少郵箱地址</p>
                        )}
                        {booking.hasErrors.noPhone && (
                          <p>⚠️ 缺少電話號碼</p>
                        )}
                        {booking.hasErrors.invalidDates && (
                          <p>⚠️ 入住日期晚於退房日期</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 訂單詳情 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">入住日期</p>
                      <p className="text-foreground font-medium">
                        {new Date(booking.checkInDate).toLocaleDateString(
                          "zh-TW"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">退房日期</p>
                      <p className="text-foreground font-medium">
                        {new Date(booking.checkOutDate).toLocaleDateString(
                          "zh-TW"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">入住人數</p>
                      <p className="text-foreground font-medium">
                        {booking.numberOfGuests || 2} 人
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">聯絡電話</p>
                      <p className="text-foreground font-medium">
                        {booking.guestPhone || "未提供"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">聯絡信箱</p>
                      <p className="text-foreground font-medium truncate">
                        {booking.guestEmail || "未提供"}
                      </p>
                    </div>
                  </div>

                  {/* 快速操作按鈕 */}
                  <div className="flex flex-wrap gap-2 mt-4" onClick={(e) => e.stopPropagation()}>                {booking.status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          if (confirm('確定要確認這個訂房嗎？')) {
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
                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          if (confirm('確定要標記客人已入住嗎？')) {
                            markCheckedInMutation.mutate({ id: booking.id });
                          }
                        }}
                        disabled={markCheckedInMutation.isPending}
                      >
                        {markCheckedInMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <CheckSquare size={14} className="mr-1" />
                        )}
                        標記入住
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-foreground hover:bg-accent"
                      onClick={() => {
                        if (!booking.guestEmail) {
                          toast.error('該訂單沒有郵件地址');
                          return;
                        }
                        if (confirm(`確定要發送確認郵件給 ${booking.guestEmail} 嗎？`)) {
                          sendEmailMutation.mutate({ id: booking.id });
                        }
                      }}
                      disabled={sendEmailMutation.isPending || !booking.guestEmail}
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
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`確定要删除訂單 #${booking.id} 嗎？此操作無法撤銷！`)) {
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
                      删除
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery || statusFilter !== "all" || dateFilter !== "all"
              ? "沒有符合條件的訂單"
              : "尚無訂單資料"}
          </p>
        )}
      </Card>
    </div>
  );
}
