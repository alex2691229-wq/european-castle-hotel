import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, User, Phone, Mail, Home } from "lucide-react";

export default function BookingConfirmation() {
  const [, navigate] = useLocation();
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    // 從 sessionStorage 獲取訂單數據
    const data = sessionStorage.getItem("bookingConfirmation");
    if (data) {
      setBookingData(JSON.parse(data));
      // 清除 sessionStorage
      sessionStorage.removeItem("bookingConfirmation");
    } else {
      // 如果沒有數據，重定向到首頁
      navigate("/");
    }
  }, [navigate]);

  if (!bookingData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative h-64 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/pFBLqdisXmBi.jpg"
            alt="Booking Confirmation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl font-bold text-foreground mb-4 text-gold-gradient">
              訂房確認
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              BOOKING CONFIRMATION
            </p>
          </div>
        </div>
      </section>

      {/* Confirmation Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-card border-border shadow-luxury">
            <CardContent className="p-8">
              {/* Success Icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  訂房成功！
                </h2>
                <p className="text-muted-foreground">
                  感謝您的預訂，我們已收到您的訂單
                </p>
              </div>

              {/* Booking Details */}
              <div className="space-y-6">
                <div className="p-6 bg-background rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    訂單詳情
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Home className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">房型</p>
                        <p className="text-foreground font-medium">
                          {bookingData.roomName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">入住日期</p>
                        <p className="text-foreground font-medium">
                          {new Date(bookingData.checkInDate).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">退房日期</p>
                        <p className="text-foreground font-medium">
                          {new Date(bookingData.checkOutDate).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">住宿天數</p>
                        <p className="text-foreground font-medium">
                          {bookingData.nights} 晚
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">總金額</p>
                      <p className="text-3xl font-bold text-primary">
                        NT$ {bookingData.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-6 bg-background rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    聯絡資訊
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">姓名</p>
                        <p className="text-foreground font-medium">
                          {bookingData.guestName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">電話</p>
                        <p className="text-foreground font-medium">
                          {bookingData.guestPhone}
                        </p>
                      </div>
                    </div>

                    {bookingData.guestEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">郵箱</p>
                          <p className="text-foreground font-medium">
                            {bookingData.guestEmail}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-900 mb-3">
                    💳 銀行轉帳付款指示
                  </h3>
                  <div className="space-y-3 text-sm text-amber-800">
                    <p className="font-medium">請於確認後 3 天內進行銀行轉帳：</p>
                    <div className="bg-white p-3 rounded border border-amber-300 space-y-2">
                      <div>
                        <p className="text-xs text-amber-600">銀行名稱</p>
                        <p className="font-mono font-bold text-amber-900">台灣銀行</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600">帳號</p>
                        <p className="font-mono font-bold text-amber-900">028001003295</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600">帳戶名</p>
                        <p className="font-mono font-bold text-amber-900">歐堡商務汽車旅館</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-amber-300">
                      <p className="text-xs text-amber-600 mb-1">轉帳金額</p>
                      <p className="font-mono font-bold text-amber-900">NT$ {bookingData.totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-amber-300">
                      <p className="text-xs text-amber-600 mb-1">備註欄請填寫訂房編號</p>
                      <p className="font-mono font-bold text-amber-900">訂房編號：#XXXXXX</p>
                    </div>
                    <p className="text-xs italic">轉帳完成後，請在訂房追蹤頁面填寫轉帳後五碼，以便我們快速確認收款。</p>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    接下來的步驟
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>我們的工作人員將在 24 小時內與您聯繫確認訂房詳情</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>如有任何問題，請隨時聯繫我們</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>入住當天請攜帶有效身份證件</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => navigate("/")}
                  >
                    返回首頁
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.print()}
                  >
                    列印確認單
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
