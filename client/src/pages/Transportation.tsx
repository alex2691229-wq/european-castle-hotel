import React from 'react';
import { MapPin, Phone, Mail, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Transportation() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">
            交通資訊
          </h1>
          <p className="text-lg text-primary-foreground/90">
            輕鬆抵達歐堡商務汽車旅館
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* Location Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Address Card */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">飯店地址</h3>
                  <p className="text-muted-foreground mb-4">
                    台南市新營區長榮路一段41號
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">GPS 座標：</span>
                      <br />
                      北緯 23.3045° 東經 120.2567°
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">電話</p>
                    <p className="font-semibold">06-635-9577</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">電子郵件</p>
                    <p className="font-semibold">castle6359577@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">營業時間</p>
                    <p className="font-semibold">24 小時營業</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transportation Methods */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold font-serif mb-8">交通方式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Car */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚗</span> 自駕
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 從台南市區出發約 15-20 分鐘車程</li>
                  <li>• 飯店備有免費停車場（VIP 車庫）</li>
                  <li>• 鄰近國道 3 號新營交流道</li>
                  <li>• 建議使用 Google Maps 導航</li>
                </ul>
              </CardContent>
            </Card>

            {/* By Public Transport */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚌</span> 大眾運輸
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 台鐵新營站：步行約 10-15 分鐘</li>
                  <li>• 公車站牌：新營轉運站附近</li>
                  <li>• 建議路線：台南市公車 1、2、3 號線</li>
                  <li>• 可致電飯店預約接送服務</li>
                </ul>
              </CardContent>
            </Card>

            {/* By Taxi */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚕</span> 計程車
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 台南火車站至飯店：約 200-250 元</li>
                  <li>• 新營轉運站至飯店：約 100-150 元</li>
                  <li>• 可預先致電飯店預約接送</li>
                  <li>• 飯店電話：06-635-9577</li>
                </ul>
              </CardContent>
            </Card>

            {/* By Flight */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">✈️</span> 飛機
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 台南機場至飯店：約 30 分鐘車程</li>
                  <li>• 高雄小港機場至飯店：約 1 小時車程</li>
                  <li>• 可預約租車或計程車接送</li>
                  <li>• 建議提前預訂接送服務</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Nearby Attractions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold font-serif mb-8">周邊景點</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">新營文化園區</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  距飯店約 2 公里
                </p>
                <p className="text-muted-foreground">
                  展示台灣傳統文化與藝術的重要基地，定期舉辦各類文化活動。
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">烏樹林文化園區</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  距飯店約 3 公里
                </p>
                <p className="text-muted-foreground">
                  保存日治時期的古蹟，有蒸汽火車展示與懷舊景觀。
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">關子嶺溫泉區</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  距飯店約 15 公里
                </p>
                <p className="text-muted-foreground">
                  台灣著名溫泉勝地，擁有獨特的泥漿溫泉與優美山景。
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">南瀛文化中心</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  距飯店約 5 公里
                </p>
                <p className="text-muted-foreground">
                  展示南台灣豐富的文化遺產與藝術作品。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Parking Info */}
        <Card className="border-border bg-card mb-12">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">停車資訊</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    • <span className="font-semibold">VIP 車庫：</span>
                    提供給住客的專屬停車位，免費使用
                  </li>
                  <li>
                    • <span className="font-semibold">地面停車場：</span>
                    寬敞的戶外停車區域
                  </li>
                  <li>
                    • <span className="font-semibold">停車費用：</span>
                    住客免費，訪客按時計費
                  </li>
                  <li>
                    • <span className="font-semibold">預約停車：</span>
                    可提前致電預約停車位
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Notice */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Google 地圖導航</h3>
            <p className="text-muted-foreground mb-4">
              您可以使用以下方式在 Google
              地圖上找到我們的飯店：
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• 搜尋「歐堡商務汽車旅館」</li>
              <li>• 搜尋「台南市新營區長榮路一段41號」</li>
              <li>
                • 點擊以下連結：
                <a
                  href="https://maps.google.com/?q=23.3045,120.2567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  在 Google 地圖上開啟
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
