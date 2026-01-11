import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Sparkles, Bed, Car, Wifi, Coffee, Shield } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: roomTypes, isLoading: roomsLoading } = trpc.roomTypes.list.useQuery();
  const { data: newsItems } = trpc.news.list.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero carousel images - 使用上傳的真實照片
  const heroImages = [
    "/hotel_exterior_night.webp",
    "/aLGXkllI60jA.jpg",
    "/7bImBALYq9l1.jpg",
    "/pFBLqdisXmBi.jpg",
    "/cz6FcKw42jqQ.jpg",
    "/hotel_exterior_day.webp",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: Bed, title: "精緻客房", description: "舒適優雅的住宿空間", image: "/AbVYUA17Rufq.jpg" },
    { icon: Car, title: "VIP車庫", description: "獨立私密停車空間", image: "/OfTqVUKmzbwK.jpg" },
    { icon: Wifi, title: "高速網路", description: "全館免費WiFi" },
    { icon: Coffee, title: "貼心服務", description: "24小時專業服務" },
    { icon: Shield, title: "安全隱私", description: "完善的安全設施" },
    { icon: Sparkles, title: "豪華設備", description: "頂級衛浴與設施", image: "/bHcq5GRVaZdM.jpg" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Carousel */}
      <section className="relative h-screen">
        {/* Carousel Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center text-center">
          <div className="corner-frame max-w-4xl">
            <div className="space-y-6">
              <div className="inline-block">
                <div className="h-px w-20 bg-primary mx-auto mb-6" />
                <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4 text-gold-gradient">
                  歐堡商務汽車旅館
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground tracking-widest">
                  EUROPEAN CASTLE HOTEL
                </p>
                <div className="h-px w-20 bg-primary mx-auto mt-6" />
              </div>
              
              <p className="text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto leading-relaxed">
                體驗永恆優雅與電影般的宏偉感，在台南新營享受奢華住宿體驗
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link href="/booking">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                    立即訂房
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
                    探索客房
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 border border-primary transition-all ${
                index === currentSlide ? "bg-primary scale-125" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Geometric background pattern */}
        <div className="absolute inset-0 geometric-bg pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16 art-deco-border">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              旅館特色
            </h2>
            <p className="text-muted-foreground text-lg">
              為您提供最優質的住宿體驗
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature: any, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary transition-all shadow-luxury group overflow-hidden">
                {feature.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <CardContent className={`${feature.image ? 'p-6' : 'p-8'} text-center`}>
                  <div className="w-16 h-16 mx-auto mb-6 border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-16 art-deco-border">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              精選客房
            </h2>
            <p className="text-muted-foreground text-lg">
              每個房型都經過精心設計，為您打造完美住宿體驗
            </p>
          </div>

          {roomsLoading ? (
            <div className="text-center text-muted-foreground">載入中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes?.slice(0, 6).map((room) => {
                const images = room.images ? JSON.parse(room.images) : [];
                const amenities = room.amenities ? JSON.parse(room.amenities) : [];
                
                return (
                  <Card key={room.id} className="bg-card border-border overflow-hidden group hover:border-primary transition-all shadow-luxury">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={images[0] || "/placeholder-room.jpg"}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {room.name}
                        </h3>
                        {room.size && (
                          <p className="text-sm text-white/80">{room.size}</p>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {room.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-sm text-muted-foreground">平日起</span>
                          <p className="text-2xl font-bold text-primary">
                            NT$ {Number(room.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">最多</span>
                          <p className="text-lg font-semibold text-foreground">
                            {room.capacity} 人
                          </p>
                        </div>
                      </div>
                      <Link href={`/rooms/${room.id}`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          查看詳情
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/rooms">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                查看所有客房
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      {newsItems && newsItems.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto">
            <div className="text-center mb-16 art-deco-border">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                最新消息
              </h2>
              <p className="text-muted-foreground text-lg">
                掌握最新優惠與活動資訊
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newsItems.slice(0, 3).map((item) => (
                <Card key={item.id} className="bg-card border-border hover:border-primary transition-all shadow-luxury overflow-hidden group">
                  {item.coverImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold border border-primary">
                        {item.type === "promotion" ? "優惠活動" : item.type === "event" ? "活動公告" : "最新消息"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.publishDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {item.content}
                    </p>
                    <Link href={`/news/${item.id}`}>
                      <Button variant="ghost" className="text-primary hover:text-primary/80 p-0">
                        閱讀更多 →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/news">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  查看所有消息
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-card/50 relative overflow-hidden">
        <div className="absolute inset-0 geometric-bg" />
        <div className="container mx-auto text-center relative z-10">
          <div className="corner-frame max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              立即預訂您的完美假期
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              體驗台南新營最優質的住宿服務，讓我們為您打造難忘的旅程
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                  線上訂房
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
                  聯絡我們
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
