import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  Home,
  CreditCard,
  MapPin,
  Clock,
  AlertCircle,
  Download,
  Share2,
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
      {/* Hero Section */}
      <section className="relative h-72 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/pFBLqdisXmBi.jpg"
            alt="Booking Confirmation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-400 animate-pulse">
                <CheckCircle2 className="w-14 h-14 text-green-400" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gold-gradient mb-2">
              訂房成功！
            </h1>
            <p className="text-xl text-gray-200 tracking-wider">
              BOOKING CONFIRMED
            </p>
          </div>
        </div>
      </section>

      {/* Confirmation Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Success Message */}
          <div className="mb-8 text-center">
            <p className="text-lg text-gray-600">
              感謝您選擇歐堡商務汽車旅館，我們已收到您的訂單
            </p>
            <p className="text-sm text-gray-500 mt-2">
              確認郵件已發送至您的郵箱，請查收
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Number & Status */}
              <Card className="bg-white border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">訂房編號</p>
                      <p className="text-2xl font-bold text-gray-900 font-mono">
                        #XXXXXX
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">訂房狀態</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                        待確認
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Room & Date Details */}
              <Card className="bg-white border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    房間詳情
                  </h3>

                  <div className="space-y-4">
                    {/* Room Type */}
                    <div className="pb-4 border-b border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">房型</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {bookingData.roomName}
                      </p>
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-gray-500">入住日期</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(bookingData.checkInDate).toLocaleDateString(
                            "zh-TW",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(bookingData.checkInDate).toLocaleDateString(
                            "zh-TW",
                            { weekday: "long" }
                          )}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-gray-500">退房日期</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(bookingData.checkOutDate).toLocaleDateString(
                            "zh-TW",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(bookingData.checkOutDate).toLocaleDateString(
                            "zh-TW",
                            { weekday: "long" }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-gray-500">住宿天數</p>
                        </div>
                        <p className="text-lg font-semibold text-blue-600">
                          {bookingData.nights} 晚
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Information */}
              <Card className="bg-white border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600" />
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    聯絡資訊
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">姓名</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {bookingData.guestName}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <p className="text-sm text-gray-500">電話</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {bookingData.guestPhone}
                        </p>
                      </div>

                      {bookingData.guestEmail && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-purple-600" />
                            <p className="text-sm text-gray-500">郵箱</p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            {bookingData.guestEmail}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg sticky top-24 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600" />
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    價格摘要
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">房間價格</p>
                      <p className="font-semibold text-gray-900">
                        NT$ {(
                          bookingData.totalPrice / bookingData.nights
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">× {bookingData.nights} 晚</p>
                      <p className="font-semibold text-gray-900">
                        NT$ {bookingData.totalPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-amber-200">
                      <p className="text-sm text-gray-600">稅費及服務費</p>
                      <p className="font-semibold text-gray-900">已含</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-1">應付金額</p>
                    <p className="text-3xl font-bold text-amber-600">
                      NT$ {bookingData.totalPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-semibold mb-1">
                      💡 提示
                    </p>
                    <p className="text-xs text-blue-700">
                      請於 3 天內完成銀行轉帳以確認訂房
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment Instructions */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-0 shadow-lg overflow-hidden mb-8">
            <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600" />
            <CardContent className="p-8">
              <div className="flex items-start gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-amber-900">
                    💳 銀行轉帳付款指示
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    請於確認後 3 天內進行銀行轉帳
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Bank Details */}
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    銀行名稱
                  </p>
                  <p className="text-lg font-bold text-amber-900">台灣銀行</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    帳戶名
                  </p>
                  <p className="text-lg font-bold text-amber-900">
                    歐堡商務汽車旅館
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-amber-200 md:col-span-2">
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    帳號（複製）
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-mono font-bold text-amber-900">
                      028001003295
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("028001003295");
                        alert("帳號已複製到剪貼板");
                      }}
                      className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition"
                    >
                      複製
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-amber-200 md:col-span-2">
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    轉帳金額
                  </p>
                  <p className="text-lg font-mono font-bold text-amber-900">
                    NT$ {bookingData.totalPrice.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-amber-200 md:col-span-2">
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    備註欄（請填寫訂房編號）
                  </p>
                  <p className="text-lg font-mono font-bold text-amber-900">
                    訂房編號：#XXXXXX
                  </p>
                </div>
              </div>

              <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">✓ 轉帳完成後：</span>
                  請在訂房追蹤頁面填寫轉帳後五碼，以便我們快速確認收款並完成訂房。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-0 shadow-lg overflow-hidden mb-8">
            <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-600" />
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-blue-900 mb-6">
                接下來的步驟
              </h3>
              <div className="space-y-4">
                {[
                  {
                    num: "1",
                    title: "進行銀行轉帳",
                    desc: "按照上方銀行資訊進行轉帳，金額為 NT$ " +
                      bookingData.totalPrice.toLocaleString(),
                  },
                  {
                    num: "2",
                    title: "填寫後五碼",
                    desc: "轉帳完成後，在訂房追蹤頁面填寫轉帳後五碼",
                  },
                  {
                    num: "3",
                    title: "確認收款",
                    desc: "我們將在 24 小時內確認收款並發送確認郵件",
                  },
                  {
                    num: "4",
                    title: "準備入住",
                    desc: "入住當天請攜帶有效身份證件和訂房確認單",
                  },
                ].map((step) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                        {step.num}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">{step.title}</p>
                      <p className="text-sm text-blue-700">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact & Actions */}
          <Card className="bg-white border-0 shadow-lg overflow-hidden mb-8">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">有任何問題？</p>
                  <p className="text-lg font-semibold text-gray-900">
                    聯繫我們
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    📞 (06) 2609-999
                  </p>
                  <p className="text-sm text-gray-600">
                    📧 castle6359577@gmail.com
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">需要幫助？</p>
                  <p className="text-lg font-semibold text-gray-900">
                    LINE 客服
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    🔗 加入 LINE 好友：@castle6359577
                  </p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  size="lg"
                  className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  onClick={() => navigate("/booking-tracking")}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  訂房追蹤
                </Button>
                <Button
                  size="lg"
                  className="flex-1 min-w-[200px] bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-lg"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  列印確認單
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 min-w-[200px]"
                  onClick={() => navigate("/")}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  返回首頁
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-500">
            <p>
              本確認單已發送至您的郵箱，請妥善保管。如有任何問題，請隨時與我們聯繫。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
