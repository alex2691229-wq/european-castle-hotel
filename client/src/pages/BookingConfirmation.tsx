import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, User, Phone, Mail, Home, Clock, DollarSign, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-20">
      {/* Hero Section */}
      <section className="relative h-64 flex items-center justify-center mb-12">
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
      <section className="py-12 pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Success Message */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 mb-6 shadow-lg">
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              訂房成功！
            </h2>
            <p className="text-lg text-gray-600">
              感謝您的預訂，我們已收到您的訂單，確認郵件已發送至您的郵箱
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* 訂房信息卡片 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">訂房詳情</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 房型 */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-blue-600 font-semibold mb-1">房型</p>
                      <p className="text-xl font-bold text-gray-900">
                        {bookingData.roomName}
                      </p>
                    </div>

                    {/* 住宿天數 */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-purple-600 font-semibold mb-1">住宿天數</p>
                      <p className="text-xl font-bold text-gray-900">
                        {bookingData.nights} 晚
                      </p>
                    </div>

                    {/* 入住日期 */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-sm text-green-600 font-semibold mb-1">入住日期</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(bookingData.checkInDate).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        })}
                      </p>
                    </div>

                    {/* 退房日期 */}
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <p className="text-sm text-orange-600 font-semibold mb-1">退房日期</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(bookingData.checkOutDate).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 聯絡資訊卡片 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">聯絡資訊</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">姓名</p>
                        <p className="font-semibold text-gray-900">{bookingData.guestName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">電話</p>
                        <p className="font-semibold text-gray-900">{bookingData.guestPhone}</p>
                      </div>
                    </div>

                    {bookingData.guestEmail && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">郵箱</p>
                          <p className="font-semibold text-gray-900 break-all">{bookingData.guestEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 付款指示卡片 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition bg-gradient-to-br from-amber-50 to-amber-100">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-200 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-amber-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-amber-900">💳 銀行轉帳付款指示</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-amber-900 font-semibold">
                      請於確認後 3 天內進行銀行轉帳：
                    </p>

                    {/* 銀行信息網格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                        <p className="text-xs text-amber-600 font-semibold mb-1">銀行名稱</p>
                        <p className="font-mono font-bold text-lg text-amber-900">台灣銀行</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                        <p className="text-xs text-amber-600 font-semibold mb-1">帳號</p>
                        <p className="font-mono font-bold text-lg text-amber-900">028001003295</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border-2 border-amber-300 md:col-span-2">
                        <p className="text-xs text-amber-600 font-semibold mb-1">帳戶名</p>
                        <p className="font-mono font-bold text-lg text-amber-900">歐堡商務汽車旅館</p>
                      </div>
                    </div>

                    {/* 轉帳金額 */}
                    <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                      <p className="text-xs text-amber-600 font-semibold mb-1">轉帳金額</p>
                      <p className="font-mono font-bold text-2xl text-amber-900">
                        NT$ {bookingData.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    {/* 備註 */}
                    <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                      <p className="text-xs text-amber-600 font-semibold mb-2">備註欄請填寫訂房編號</p>
                      <p className="font-mono font-bold text-amber-900">訂房編號：#XXXXXX</p>
                    </div>

                    <p className="text-sm text-amber-800 italic bg-white p-3 rounded">
                      ℹ️ 轉帳完成後，請在訂房追蹤頁面填寫轉帳後五碼，以便我們快速確認收款。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Next Steps */}
            <div className="space-y-6">
              {/* 金額總結卡片 */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 sticky top-24">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-200 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-700" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900">訂房金額</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-green-700 mb-1">總金額</p>
                      <p className="text-4xl font-bold text-green-900">
                        NT$ {bookingData.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="border-t-2 border-green-300 pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-green-800">房價 × {bookingData.nights} 晚</span>
                        <span className="font-semibold text-green-900">NT$ {bookingData.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-700">
                        <span>稅金與服務費</span>
                        <span>已含</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 接下來的步驟卡片 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">接下來的步驟</h3>
                  </div>

                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold flex-shrink-0">1</span>
                      <span className="text-sm text-gray-700">進行銀行轉帳</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold flex-shrink-0">2</span>
                      <span className="text-sm text-gray-700">填寫後五碼確認</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold flex-shrink-0">3</span>
                      <span className="text-sm text-gray-700">收到確認郵件</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold flex-shrink-0">4</span>
                      <span className="text-sm text-gray-700">入住享受服務</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* 重要提示卡片 */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <h4 className="font-bold text-blue-900 mb-3">📋 重要提示</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>入住當天請攜帶有效身份證件</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>24小時內將有工作人員聯繫</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>有問題請隨時聯繫我們</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition"
              onClick={() => navigate("/")}
            >
              ← 返回首頁
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 border-2 border-gray-300 hover:bg-gray-100"
              onClick={() => window.print()}
            >
              🖨️ 列印確認單
            </Button>
            <Button
              size="lg"
              className="px-8 bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition"
              onClick={() => navigate(`/cancel-booking?bookingId=${bookingData.bookingId}`)}
            >
              ✕ 取消訂房
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
