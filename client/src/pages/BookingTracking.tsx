import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, User, Phone, Mail, Home, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function BookingTracking() {
  const [searchPhone, setSearchPhone] = useState("");
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  
  const { data: bookings, refetch, isLoading } = trpc.bookings.getByPhone.useQuery(
    { phone: searchPhone },
    { enabled: false }
  );
  
  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("訂單已成功取消");
      refetch();
      setCancelBookingId(null);
    },
    onError: (error) => {
      toast.error(error.message || "取消失敗，請稍後再試");
      setCancelBookingId(null);
    },
  });

  const handleSearch = async () => {
    if (!searchPhone || searchPhone.length < 9) {
      toast.error("請輸入有效的電話號碼");
      return;
    }

    refetch();
  };
  
  const handleCancelBooking = (bookingId: number) => {
    setCancelBookingId(bookingId);
  };
  
  const confirmCancelBooking = () => {
    if (cancelBookingId) {
      cancelMutation.mutate({
        id: cancelBookingId,
        phone: searchPhone,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            已確認
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            待確認
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            已取消
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            已完成
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3" />
            未知狀態
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative h-64 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/pFBLqdisXmBi.jpg"
            alt="Booking Tracking"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl font-bold text-foreground mb-4 text-gold-gradient">
              訂單追蹤
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              BOOKING TRACKING
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-card border-border shadow-luxury mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                查詢您的訂單
              </h2>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="phone" className="text-foreground mb-2 block">
                    請輸入訂房時使用的電話號碼
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="例如：0912345678"
                    className="bg-background border-border text-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <Button
                  size="lg"
                  className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? "查詢中..." : "查詢訂單"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                提示：請輸入您在預訂時提供的電話號碼，我們將為您查詢所有相關訂單
              </p>
            </CardContent>
          </Card>

          {/* Booking Results */}
          {bookings && bookings.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                您的訂單（{bookings.length}）
              </h2>
              
              {bookings.map((booking) => (
                <Card key={booking.id} className="bg-card border-border shadow-luxury">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          訂單 #{booking.id}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">預訂時間</p>
                        <p className="text-foreground">
                          {new Date(booking.createdAt).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Home className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">房型</p>
                            <p className="text-foreground font-medium">
                              {booking.roomName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">入住日期</p>
                            <p className="text-foreground font-medium">
                              {new Date(booking.checkInDate).toLocaleDateString("zh-TW")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">退房日期</p>
                            <p className="text-foreground font-medium">
                              {new Date(booking.checkOutDate).toLocaleDateString("zh-TW")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">姓名</p>
                            <p className="text-foreground font-medium">
                              {booking.guestName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">電話</p>
                            <p className="text-foreground font-medium">
                              {booking.guestPhone}
                            </p>
                          </div>
                        </div>

                        {booking.guestEmail && (
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">郵箱</p>
                              <p className="text-foreground font-medium">
                                {booking.guestEmail}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">總金額</p>
                        <p className="text-2xl font-bold text-primary">
                          NT$ {Number(booking.totalPrice).toLocaleString()}
                        </p>
                      </div>
                      
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? "取消中..." : "取消訂單"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border shadow-luxury">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  尚無訂單記錄
                </h3>
                <p className="text-muted-foreground mb-6">
                  請輸入您的電話號碼查詢訂單，或前往預訂頁面進行預訂
                </p>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.location.href = "/booking"}
                >
                  立即預訂
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      
      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelBookingId !== null} onOpenChange={(open) => !open && setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消訂單</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消這個訂單嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              不，保留訂單
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelBooking}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? "取消中..." : "是，取消訂單"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
