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
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function BookingManagement() {
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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
      // 搜尋過濾
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        booking.guestName.toLowerCase().includes(searchLower) ||
        booking.guestPhone.includes(searchQuery) ||
        booking.guestEmail.toLowerCase().includes(searchLower) ||
        booking.id.toString().includes(searchQuery);

      if (!matchesSearch) return false;

      // 狀態過濾
      if (statusFilter !== "all" && booking.status !== statusFilter)
        return false;

      // 日期過濾
      if (dateFilter === "urgent" && !booking.isUrgent) return false;
      if (dateFilter === "week" && booking.daysUntilCheckIn > 7) return false;
      if (dateFilter === "month" && booking.daysUntilCheckIn > 30) return false;

      return true;
    });
  }, [processedBookings, searchQuery, statusFilter, dateFilter]);

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
          <div className="grid grid-cols-2 gap-4">
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
                  className={`p-4 rounded-lg border ${
                    booking.isUrgent
                      ? "bg-red-50 border-red-200"
                      : "bg-background border-border"
                  }`}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
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
                  <div className="flex gap-2">
                    {booking.status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        ✓ 確認訂房
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-foreground hover:bg-background"
                    >
                      📧 發送郵件
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-foreground hover:bg-background"
                    >
                      編輯
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
