import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, Phone, Mail, Calendar, Home, DollarSign, Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BookingDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const bookingId = params.id ? parseInt(params.id) : 0;

  const { data: booking, isLoading } = trpc.bookings.getById.useQuery({ id: bookingId });
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("訂單狀態已更新");
      utils.bookings.getById.invalidate({ id: bookingId });
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteBookingMutation = trpc.bookings.deleteBooking.useMutation({
    onSuccess: () => {
      toast.success("訂單已刪除");
      setLocation("/admin/bookings");
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold mb-2">訂單不存在</h2>
          <p className="text-muted-foreground mb-4">找不到訂單 #{bookingId}</p>
          <Button onClick={() => setLocation("/admin/bookings")}>
            <ArrowLeft size={16} className="mr-2" />
            返回訂單列表
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "待確認";
      case "confirmed":
        return "已確認";
      case "cancelled":
        return "已取消";
      case "completed":
        return "已完成";
      default:
        return status;
    }
  };

  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="container mx-auto py-8">
      {/* 頁首 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/bookings")}
          >
            <ArrowLeft size={16} className="mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">訂單詳情</h1>
            <p className="text-muted-foreground">訂單編號 #{booking.id}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(booking.status)}`}>
          {getStatusLabel(booking.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：客人信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 客人信息卡片 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User size={20} className="text-gold" />
              客人信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">姓名</p>
                <p className="font-semibold text-foreground">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone size={14} />
                  電話
                </p>
                <p className="font-semibold text-foreground">{booking.guestPhone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail size={14} />
                  郵箱
                </p>
                <p className="font-semibold text-foreground">
                  {booking.guestEmail || (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      未提供
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* 預訂信息卡片 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-gold" />
              預訂信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">房型</p>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Home size={14} />
                  {booking.roomTypeName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">入住人數</p>
                <p className="font-semibold text-foreground">{booking.guests} 人</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">入住日期</p>
                <p className="font-semibold text-foreground">
                  {checkInDate.toLocaleDateString("zh-TW")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">退房日期</p>
                <p className="font-semibold text-foreground">
                  {checkOutDate.toLocaleDateString("zh-TW")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">住宿天數</p>
                <p className="font-semibold text-foreground">{nights} 晚</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign size={14} />
                  總金額
                </p>
                <p className="font-semibold text-gold text-lg">
                  NT$ {booking.totalPrice?.toLocaleString() || "未計算"}
                </p>
              </div>
            </div>
          </Card>

          {/* 特殊需求卡片 */}
          {booking.specialRequests && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">特殊需求</h2>
              <p className="text-foreground whitespace-pre-wrap">{booking.specialRequests}</p>
            </Card>
          )}
        </div>

        {/* 右側：操作和時間軸 */}
        <div className="space-y-6">
          {/* 快速操作卡片 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">快速操作</h2>
            <div className="space-y-2">
              {booking.status === "pending" && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    if (confirm("確定要確認此訂單嗎？")) {
                      updateStatusMutation.mutate({ id: booking.id, status: "confirmed" });
                    }
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  確認訂單
                </Button>
              )}
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (confirm("確定要標記客人已入住嗎？")) {
                      updateStatusMutation.mutate({ id: booking.id, status: "completed" });
                    }
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  標記入住
                </Button>
              )}
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <Button
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("確定要取消此訂單嗎？")) {
                      updateStatusMutation.mutate({ id: booking.id, status: "cancelled" });
                    }
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  取消訂單
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm(`確定要刪除訂單 #${booking.id} 嗎？此操作無法撤銷！`)) {
                    deleteBookingMutation.mutate({ id: booking.id });
                  }
                }}
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                刪除訂單
              </Button>
            </div>
          </Card>

          {/* 時間信息卡片 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-gold" />
              時間信息
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">創建時間</p>
                <p className="font-semibold text-foreground">
                  {new Date(booking.createdAt).toLocaleString("zh-TW")}
                </p>
              </div>
              {booking.updatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">最後更新</p>
                  <p className="font-semibold text-foreground">
                    {new Date(booking.updatedAt).toLocaleString("zh-TW")}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
