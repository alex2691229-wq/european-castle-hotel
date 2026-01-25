import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Car, Train, Navigation } from "lucide-react";

export default function Location() {
  const hotelAddress = "台南市新營區長榮路一段41號";
  const hotelPhone = "06-635-9577";

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelAddress)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/vQhIG5DA9eI6.jpg"
            alt="Location"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-gold-gradient">
              交通資訊
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              LOCATION & DIRECTIONS
            </p>
          </div>
        </div>
        <div className="absolute inset-0 geometric-bg pointer-events-none opacity-30" />
      </section>

      {/* Location Info */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Address Card */}
            <Card className="bg-card border-border shadow-luxury">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <MapPin size={32} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">旅館地址</h3>
                    <p className="text-muted-foreground text-lg">{hotelAddress}</p>
                  </div>
                </div>
                <Button 
                  onClick={openGoogleMaps}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Navigation size={18} className="mr-2" />
                  開啟 Google 地圖導航
                </Button>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-card border-border shadow-luxury">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">聯絡電話</h3>
                    <p className="text-3xl font-bold text-primary mb-2">{hotelPhone}</p>
                    <p className="text-muted-foreground">24小時服務專線</p>
                  </div>
                  <Button 
                    onClick={() => window.location.href = `tel:${hotelPhone}`}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10"
                  >
                    立即撥打
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map Placeholder */}
          <Card className="bg-card border-border shadow-luxury overflow-hidden mb-12">
            <div className="relative h-96 bg-secondary/20 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={48} className="text-primary mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">點擊下方按鈕開啟 Google 地圖查看詳細位置</p>
                <Button 
                  onClick={openGoogleMaps}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  開啟地圖
                </Button>
              </div>
            </div>
          </Card>

          {/* Directions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* By Car */}
            <Card className="bg-card border-border shadow-luxury">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <Car size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">自行開車</h3>
                  </div>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">國道1號</h4>
                    <p>下新營交流道，往新營市區方向行駛約5分鐘即可抵達</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">台1線</h4>
                    <p>沿台1線行駛至新營區長榮路一段，即可看到本旅館</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">停車資訊：</span>
                      每間客房皆配備獨立車庫，無需擔心停車問題
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* By Train */}
            <Card className="bg-card border-border shadow-luxury">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <Train size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">大眾運輸</h3>
                  </div>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">火車</h4>
                    <p>搭乘火車至新營火車站，出站後步行約20分鐘或搭乘計程車約3分鐘即可抵達</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">高鐵</h4>
                    <p>搭乘高鐵至嘉義站，轉乘搞鐵接駁車至新營東仁長榮路口公車站，步行2分鐘</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">接駁服務：</span>
                      如需接駁服務，請提前來電預約
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nearby Attractions */}
          <div className="mt-16">
            <div className="text-center mb-12 art-deco-border">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                周邊景點
              </h2>
              <p className="text-muted-foreground">
                探索新營地區的熱門景點與美食
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border hover:border-primary transition-all shadow-luxury">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold text-foreground mb-2">新營糖廠</h3>
                  <p className="text-sm text-muted-foreground mb-2">車程約 5 分鐘</p>
                  <p className="text-sm text-muted-foreground">
                    歷史悠久的糖廠，可品嚐美味冰品與參觀文化展示
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:border-primary transition-all shadow-luxury">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold text-foreground mb-2">南瀛綠都心公園</h3>
                  <p className="text-sm text-muted-foreground mb-2">車程約 3 分鐘</p>
                  <p className="text-sm text-muted-foreground">
                    寬敞的綠地公園，適合散步休閒與親子活動
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:border-primary transition-all shadow-luxury">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold text-foreground mb-2">新營太子宮</h3>
                  <p className="text-sm text-muted-foreground mb-2">車程約15分鐘</p>
                  <p className="text-sm text-muted-foreground">
                    品嚐道地台南小吃與在地美食的最佳選擇
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
