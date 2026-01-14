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
  const [currentPage, setCurrentPage] = useState(1);
  const [quickFilter, setQuickFilter] = useState<'all' | 'pending' | 'confirmed' | 'pending_payment' | 'today_checkin'>('all');
  const itemsPerPage = 10;
  
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
  
  const selectPaymentMethodMutation = trpc.bookings.selectPaymentMethod.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success('支付方式已選擇');
    },
    onError: (error) => {
      toast.error(`選擇失敗：${error.message}`);
    },
  });
  
  const confirmBankTransferMutation = trpc.bookings.confirmBankTransfer.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success('銀行轉帳已確認');
    },
    onError: (error) => {
      toast.error(`確認失敗：${error.message}`);
    },
  });
  
  const [bankTransferDialogOpen, setBankTransferDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [lastFiveDigits, setLastFiveDigits] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  
  // 處理快速篩選按鈕點擊
  const handleQuickFilter = (filter: 'all' | 'pending' | 'confirmed' | 'pending_payment' | 'today_checkin') => {
    setQuickFilter(filter);
    setCurrentPage(1);
    setSearchQuery('');
    setDateFilter('all');
    setRoomTypeFilter('all');
    
    // 更新狀態篩選
    if (filter === 'all') {
      setStatusFilter('all');
    } else if (filter === 'pending') {
      setStatusFilter('pending');
    } else if (filter === 'confirmed') {
      setStatusFilter('confirmed');
    } else if (filter === 'pending_payment') {
      setStatusFilter('pending_payment');
    } else if (filter === 'today_checkin') {
      setStatusFilter('all');
      setDateFilter('urgent');
    }
  };
  
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
    let filtered = processedBookings.filter((booking: any) => {
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
    return filtered;
  }, [processedBookings, searchQuery, statusFilter, dateFilter, roomTypeFilter]);
  
  // 計算分頁
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

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
      {/* 快速篩選按鈕 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleQuickFilter('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === 'all'
              ? 'bg-blue-900 border-blue-500 text-white'
              : 'bg-card border-border hover:border-blue-500'
          }`}
        >
          <p className="text-sm text-muted-foreground">全部訂單</p>
          <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
        </button>
        <button
          onClick={() => handleQuickFilter('pending')}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === 'pending'
              ? 'bg-yellow-900 border-yellow-500 text-white'
              : 'bg-card border-border hover:border-yellow-500'
          }`}
        >
          <p className="text-sm text-muted-foreground">待確認</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </button>
        <button
          onClick={() => handleQuickFilter('confirmed')}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === 'confirmed'
              ? 'bg-green-900 border-green-500 text-white'
              : 'bg-card border-border hover:border-green-500'
          }`}
        >
          <p className="text-sm text-muted-foreground">已確認</p>
          <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
        </button>
        <button
          onClick={() => handleQuickFilter('pending_payment')}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === 'pending_payment'
              ? 'bg-orange-900 border-orange-500 text-white'
              : 'bg-card border-border hover:border-orange-500'
          }`}
        >
          <p className="text-sm text-muted-foreground">待付款</p>
          <p className="text-2xl font-bold text-orange-400">{processedBookings.filter((b: any) => b.status === 'pending_payment').length}</p>
        </button>
        <button
          onClick={() => handleQuickFilter('today_checkin')}
          className={`p-4 rounded-lg border-2 transition-all ${
            quickFilter === 'today_checkin'
              ? 'bg-purple-900 border-purple-500 text-white'
              : 'bg-card border-border hover:border-purple-500'
          }`}
        >
          <p className="text-sm text-muted-foreground">當日入住</p>
          <p className="text-2xl font-bold text-purple-400">{processedBookings.filter((b: any) => b.daysUntilCheckIn === 0).length}</p>
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
        ) : paginatedBookings.length > 0 ? (
          <div className="space-y-3">
            {paginatedBookings.map((booking: any) => {
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
                    {booking.status === "confirmed" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => {
                            if (confirm('確定選擇銀行轉帳支付方式嗎？')) {
                              selectPaymentMethodMutation.mutate({ 
                                id: booking.id,
                                method: 'bank_transfer'
                              });
                            }
                          }}
                          disabled={selectPaymentMethodMutation.isPending}
                        >
                          {selectPaymentMethodMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <span className="mr-1">🏦</span>
                          )}
                          銀行轉帳
                        </Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => {
                            if (confirm('確定選擇現場支付方式嗎？')) {
                              selectPaymentMethodMutation.mutate({ 
                                id: booking.id,
                                method: 'cash_on_site'
                              });
                            }
                          }}
                          disabled={selectPaymentMethodMutation.isPending}
                        >
                          {selectPaymentMethodMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <span className="mr-1">💵</span>
                          )}
                          現場支付
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
                        <span className="mr-1">✓</span>
                        確認銀行轉帳
                      </Button>
                    )}
                    {(booking.status === "paid" || booking.status === "cash_on_site") && (
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
        
        {/* 分頁控制 */}
        {filteredBookings.length > itemsPerPage && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-border">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-border text-foreground hover:bg-accent"
            >
              ← 上一頁
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  className={currentPage === pageNum ? 'bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-border text-foreground hover:bg-accent"
            >
              下一頁 →
            </Button>
          </div>
        )}
        
        {/* 分頁信息 */}
        {filteredBookings.length > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            第 {currentPage} 頁，共 {totalPages} 頁 | 顯示 {paginatedBookings.length} / {filteredBookings.length} 筆訂單
          </div>
        )}
      </Card>
      
      {/* 銀行轉帳後五碼輸入對話框 */}
      {bankTransferDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold text-foreground mb-4">確認銀行轉帳</h3>
            <p className="text-sm text-muted-foreground mb-4">
              請輸入銀行轉帳帳號後五碼以確認付款
            </p>
            <input
              type="text"
              value={lastFiveDigits}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 5) {
                  setLastFiveDigits(value);
                }
              }}
              placeholder="請輸入後五碼"
              maxLength={5}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setBankTransferDialogOpen(false);
                  setLastFiveDigits('');
                  setSelectedBookingId(null);
                }}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  if (lastFiveDigits.length !== 5) {
                    toast.error('請輸入完整的後五碼');
                    return;
                  }
                  if (selectedBookingId) {
                    confirmBankTransferMutation.mutate({
                      id: selectedBookingId,
                      lastFiveDigits
                    });
                    setBankTransferDialogOpen(false);
                    setLastFiveDigits('');
                    setSelectedBookingId(null);
                  }
                }}
                disabled={confirmBankTransferMutation.isPending || lastFiveDigits.length !== 5}
              >
                {confirmBankTransferMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                確認
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
