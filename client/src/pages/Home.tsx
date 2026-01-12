import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Sparkles, Bed, Car, Wifi, Coffee, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function Home() {
  const { data: roomTypes, isLoading: roomsLoading } = trpc.roomTypes.list.useQuery();
  const { data: newsItems } = trpc.news.list.useQuery();
  const { data: homeConfig } = trpc.homeConfig.get.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([
    "/hotel_exterior_night.webp",
    "/hotel_exterior_day.webp",
  ]);

  // 從資料庫更新輪播圖片
  useEffect(() => {
    if (homeConfig?.carouselImages) {
      try {
        const images = JSON.parse(homeConfig.carouselImages);
        if (Array.isArray(images) && images.length > 0) {
          setHeroImages(images);
        }
      } catch (error) {
        console.error("Failed to parse carousel images:", error);
      }
    }
  }, [homeConfig]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const features = [
    { 
      icon: Bed, 
      title: "精緻客房", 
      description: "舒適優雅的住宿空間", 
      image: homeConfig?.deluxeRoomImage || "/AbVYUA17Rufq.jpg" 
    },
    { 
      icon: Car, 
      title: "VIP車庫", 
      description: "獨立私密停車空間", 
      image: homeConfig?.vipGarageImage || "/OfTqVUKmzbwK.jpg" 
    },
    { icon: Wifi, title: "高速網路", description: "全館免費WiFi" },
    { icon: Coffee, title: "貼心服務", description: "24小時專業服務" },
    { icon: Shield, title: "安全隱私", description: "完善的安全設施" },
    { 
      icon: Sparkles, 
      title: "豪華設備", 
      description: "頂級衛浴與設施", 
      image: homeConfig?.facilitiesImage || "/bHcq5GRVaZdM.jpg" 
    },
  ];

  // 安全解析 JSON 的輔助函數
  const safeJsonParse = (jsonString: string | null | undefined, defaultValue: any[] = []) => {
    if (!jsonString || jsonString.trim() === '') return defaultValue;
    
    // 如果已經是陣列，直接返回
    if (Array.isArray(jsonString)) return jsonString;
    
    // 如果不是 JSON 格式（不以 [ 或 { 開頭），返回預設值
    const trimmed = jsonString.trim();
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
      return defaultValue;
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (error) {
      console.warn('JSON parse error, using default value:', error);
      return defaultValue;
    }
  };

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

              <div className="flex gap-4 justify-center pt-6">
                <Link href="/booking">
                  <button className="px-8 py-3 bg-gold text-black font-bold hover:bg-gold/90 transition-colors rounded">
                    立即訂房
                  </button>
                </Link>
                <Link href="/rooms">
                  <button className="px-8 py-3 border-2 border-gold text-gold hover:bg-gold/10 transition-colors rounded font-semibold">
                    探索客房
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? "bg-gold w-8" : "bg-gold/50 hover:bg-gold/75"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/40 border-y border-gold/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">
              尊享服務
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              我們為您精心準備每一項服務，確保您的住宿體驗無與倫比
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-black/60 border-gold/20 hover:border-gold/50 transition-all overflow-hidden group">
                  {feature.image && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <Icon className="w-12 h-12 text-gold mb-4" />
                    <h3 className="text-xl font-bold text-gold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">
              精選客房
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              每間客房都經過精心設計，融合現代舒適與古典優雅
            </p>
          </div>

          {roomsLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">載入中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes?.slice(0, 3).map((room) => {
                const images = safeJsonParse(room.images);
                const amenities = safeJsonParse(room.amenities);

                return (
                  <Link key={room.id} href={`/rooms/${room.id}`}>
                    <Card className="bg-black/60 border-gold/20 hover:border-gold/50 transition-all cursor-pointer overflow-hidden group">
                      {images.length > 0 && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={images[0]}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gold mb-2">{room.name}</h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{room.description}</p>
                        
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-sm text-gray-500">平日價格</p>
                            <p className="text-xl font-bold text-gold">NT${room.price}</p>
                          </div>
                          {room.weekendPrice && (
                            <div>
                              <p className="text-sm text-gray-500">假日價格</p>
                              <p className="text-xl font-bold text-gold">NT${room.weekendPrice}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            {room.capacity} 人 • {room.size || "標準"}
                          </span>
                          <span className="text-gold text-sm font-semibold">查看詳情 →</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/rooms">
              <button className="px-8 py-3 border-2 border-gold text-gold hover:bg-gold/10 transition-colors rounded font-semibold">
                查看全部客房
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      {newsItems && newsItems.length > 0 && (
        <section className="py-20 bg-black/40 border-y border-gold/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">
                最新消息
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {newsItems.slice(0, 2).map((news) => (
                <Link key={news.id} href={`/news`}>
                  <Card className="bg-black/60 border-gold/20 hover:border-gold/50 transition-all cursor-pointer overflow-hidden group">
                    {news.coverImage && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={news.coverImage}
                          alt={news.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-gold/20 text-gold px-3 py-1 rounded">
                          {news.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(news.publishDate).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gold mb-2 line-clamp-2">
                        {news.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-3">{news.content}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gold mb-6">
            準備好享受奢華住宿嗎？
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            立即預訂您的房間，體驗歐堡商務汽車旅館的獨特魅力
          </p>
          <Link href="/booking">
            <button className="px-12 py-4 bg-gold text-black font-bold text-lg hover:bg-gold/90 transition-colors rounded">
              立即訂房
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
