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
  ChevronUp,
  ChevronDown,
  Search,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SortField = "id" | "guestName" | "checkInDate" | "totalPrice" | "status";
type SortOrder = "asc" | "desc";

export default function BookingListView() {
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const utils = trpc.useUtils();

  // 狀態管理
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("checkInDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookings, setSelectedBookings] = useState<Set<number>>(
    new Set()
  );
  const itemsPerPage = 20;

  // 快速操作 mutations
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

  const deleteBookingMutation = trpc.bookings.deleteBooking.useMutation({
    onSuccess: () => {
      toast.success("訂單已刪除");
      utils.bookings.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
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

  // 獲取房型列表
  const { data: roomTypes } = trpc.roomTypes.list.useQuery();

  // 篩選和排序邏輯
  const filteredAndSortedBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = bookings.filter((booking: any) => {
      // 搜尋過濾
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

      // 房型過濾
      if (
        roomTypeFilter !== "all" &&
        booking.roomTypeId !== parseInt(roomTypeFilter)
      )
        return false;

      // 日期範圍過濾
      if (dateFromFilter) {
        const bookingDate = new Date(booking.checkInDate);
        const filterDate = new Date(dateFromFilter);
        if (bookingDate < filterDate) return false;
      }

      if (dateToFilter) {
        const bookingDate = new Date(booking.checkInDate);
        const filterDate = new Date(dateToFilter);
        if (bookingDate > filterDate) return false;
      }

      return true;
    });

    // 排序
    filtered.sort((a: any, b: any) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // 處理日期比較
      if (sortField === "checkInDate") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bookings, searchQuery, statusFilter, roomTypeFilter, dateFromFilter, dateToFilter, sortField, sortOrder]);

  // 分頁
  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredAndSortedBookings.slice(
    startIndex,
    endIndex
  );

  // 狀態標籤配置
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "待確認",
        };
      case "confirmed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "已確認",
        };
      case "pending_payment":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "待付款",
        };
      case "paid":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "已付款",
        };
      case "cash_on_site":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          label: "現場付款",
        };
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "已完成",
        };
      case "cancelled":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "已取消",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "未知",
        };
    }
  };

  // 排序列點擊處理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // 批量操作
  const handleBatchConfirm = () => {
    if (selectedBookings.size === 0) {
      toast.error("請選擇至少一筆訂單");
      return;
    }

    selectedBookings.forEach((id) => {
      confirmBookingMutation.mutate({ id });
    });

    setSelectedBookings(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedBookings.size === 0) {
      toast.error("請選擇至少一筆訂單");
      return;
    }

    if (!window.confirm(`確定要刪除 ${selectedBookings.size} 筆訂單嗎？`)) {
      return;
    }

    selectedBookings.forEach((id) => {
      deleteBookingMutation.mutate({ id });
    });

    setSelectedBookings(new Set());
  };

  const toggleSelectBooking = (id: number) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBookings(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === paginatedBookings.length) {
      setSelectedBookings(new Set());
    } else {
      const allIds = new Set(paginatedBookings.map((b: any) => b.id));
      setSelectedBookings(allIds);
    }
  };

  // 排序指示器
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      {/* 篩選和搜尋區域 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">篩選和搜尋</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 搜尋框 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              搜尋（訂單號、客戶名、電話）
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="搜尋..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-background text-foreground border-border"
              />
            </div>
          </div>

          {/* 狀態篩選 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              訂單狀態
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-background text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="pending_payment">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="cash_on_site">現場付款</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 房型篩選 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              房型
            </label>
            <Select
              value={roomTypeFilter}
              onValueChange={(value) => {
                setRoomTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-background text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部房型</SelectItem>
                {roomTypes?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 入住日期範圍 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              入住日期範圍
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => {
                  setDateFromFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-background text-foreground border-border"
              />
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => {
                  setDateToFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-background text-foreground border-border"
              />
            </div>
          </div>
        </div>

        {/* 清除篩選按鈕 */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setRoomTypeFilter("all");
              setDateFromFilter("");
              setDateToFilter("");
              setCurrentPage(1);
            }}
          >
            清除篩選
          </Button>
        </div>
      </Card>

      {/* 批量操作區域 */}
      {selectedBookings.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              已選擇 {selectedBookings.size} 筆訂單
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBatchConfirm}
                disabled={confirmBookingMutation.isPending}
              >
                {confirmBookingMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                批量確認
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                批量刪除
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedBookings(new Set())}
              >
                取消選擇
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 訂單列表表格 */}
      <Card className="p-6 bg-card border-border overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            訂單列表 ({filteredAndSortedBookings.length})
          </h2>
          <Button size="sm" variant="outline">
            <Download size={14} className="mr-1" />
            導出
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : paginatedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-800">
                  <th className="text-left py-4 px-5">
                    <input
                      type="checkbox"
                      checked={
                        selectedBookings.size === paginatedBookings.length &&
                        paginatedBookings.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th
                    className="text-left py-4 px-5 font-semibold text-foreground cursor-pointer hover:bg-slate-700"
                    onClick={() => handleSort("id")}
                  >
                    訂單編號 <SortIndicator field="id" />
                  </th>
                  <th
                    className="text-left py-4 px-5 font-semibold text-foreground cursor-pointer hover:bg-slate-700"
                    onClick={() => handleSort("guestName")}
                  >
                    客戶名稱 <SortIndicator field="guestName" />
                  </th>
                  <th className="text-left py-4 px-5 font-semibold text-foreground">
                    房型
                  </th>
                  <th
                    className="text-left py-4 px-5 font-semibold text-foreground cursor-pointer hover:bg-slate-700"
                    onClick={() => handleSort("checkInDate")}
                  >
                    入住日期 <SortIndicator field="checkInDate" />
                  </th>
                  <th className="text-left py-4 px-5 font-semibold text-foreground">
                    退房日期
                  </th>
                  <th
                    className="text-left py-4 px-5 font-semibold text-foreground cursor-pointer hover:bg-slate-700"
                    onClick={() => handleSort("totalPrice")}
                  >
                    金額 <SortIndicator field="totalPrice" />
                  </th>
                  <th
                    className="text-left py-4 px-5 font-semibold text-foreground cursor-pointer hover:bg-slate-700"
                    onClick={() => handleSort("status")}
                  >
                    狀態 <SortIndicator field="status" />
                  </th>
                  <th className="text-left py-4 px-5 font-semibold text-foreground">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking: any) => {
                  const statusBadge = getStatusBadge(booking.status);
                  const roomType = roomTypes?.find(
                    (rt: any) => rt.id === booking.roomTypeId
                  );

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-border hover:bg-slate-800 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.id)}
                          onChange={() => toggleSelectBooking(booking.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="py-4 px-5 font-medium text-foreground">
                        #{booking.id}
                      </td>
                      <td className="py-4 px-5 text-foreground">
                        {booking.guestName}
                        <div className="text-xs text-muted-foreground">
                          {booking.guestPhone}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-foreground">
                        {roomType?.name || "未知"}
                      </td>
                      <td className="py-4 px-5 text-foreground">
                        {new Date(booking.checkInDate).toLocaleDateString(
                          "zh-TW"
                        )}
                      </td>
                      <td className="py-4 px-5 text-foreground">
                        {new Date(booking.checkOutDate).toLocaleDateString(
                          "zh-TW"
                        )}
                      </td>
                      <td className="py-4 px-5 font-medium text-foreground">
                        NT${booking.totalPrice.toLocaleString()}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {booking.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                confirmBookingMutation.mutate({ id: booking.id })
                              }
                              disabled={confirmBookingMutation.isPending}
                            >
                              確認
                            </Button>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                markCheckedInMutation.mutate({ id: booking.id })
                              }
                              disabled={markCheckedInMutation.isPending}
                            >
                              入住
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              sendEmailMutation.mutate({ id: booking.id })
                            }
                            disabled={sendEmailMutation.isPending}
                          >
                            <Mail size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "確定要刪除此訂單嗎？"
                                )
                              ) {
                                deleteBookingMutation.mutate({
                                  id: booking.id,
                                });
                              }
                            }}
                            disabled={deleteBookingMutation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            沒有找到符合條件的訂單
          </div>
        )}

        {/* 分頁控制 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              第 {currentPage} 頁，共 {totalPages} 頁 | 顯示{" "}
              {paginatedBookings.length} / {filteredAndSortedBookings.length}{" "}
              筆訂單
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ← 上一頁
              </Button>

              {/* 頁碼按鈕 */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={
                        currentPage === page ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一頁 →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
