import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function BookingManagement() {
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">訂單列表</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking: any) => (
              <div
                key={booking.id}
                className="p-4 bg-background border border-border rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {booking.guestName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      訂單 #{booking.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === "confirmed" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : booking.status === "cancelled" ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : null}
                    <span className="text-sm font-medium text-foreground">
                      {booking.status === "confirmed"
                        ? "已確認"
                        : booking.status === "pending"
                          ? "待確認"
                          : "已取消"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">入住日期</p>
                    <p className="text-foreground">
                      {new Date(booking.checkInDate).toLocaleDateString(
                        "zh-TW"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">退房日期</p>
                    <p className="text-foreground">
                      {new Date(booking.checkOutDate).toLocaleDateString(
                        "zh-TW"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">聯絡電話</p>
                    <p className="text-foreground">{booking.guestPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">聯絡信箱</p>
                    <p className="text-foreground">{booking.guestEmail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            尚無訂單資料
          </p>
        )}
      </Card>
    </div>
  );
}
