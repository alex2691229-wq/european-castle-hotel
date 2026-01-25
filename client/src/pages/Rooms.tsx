// @ts-nocheck
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Maximize2 } from "lucide-react";

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

export default function Rooms() {
  const { data: roomTypes, isLoading } = trpc.roomTypes.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-20">
          <div className="text-center text-muted-foreground">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/aLGXkllI60jA.jpg"
            alt="Rooms"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-gold-gradient">
              客房介紹
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              ROOMS & SUITES
            </p>
          </div>
        </div>
        <div className="absolute inset-0 geometric-bg pointer-events-none opacity-30" />
      </section>

      {/* Rooms Grid */}
      <section className="py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16 art-deco-border">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              精心設計的奢華空間
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              每個房型都經過精心設計，融合 Art Deco 經典元素與現代舒適設備，為您打造完美的住宿體驗
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {roomTypes?.map((room) => {
              const images = safeJsonParse(room.images);
              const amenities = safeJsonParse(room.amenities);
              
              return (
                <Card 
                  key={room.id} 
                  className="bg-card border-border overflow-hidden group hover:border-primary transition-all shadow-luxury"
                >
                  {/* Image Gallery */}
                  <div className="relative h-80 overflow-hidden">
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {images.slice(0, 2).map((img: string, idx: number) => (
                        <div key={idx} className="relative overflow-hidden">
                          <img
                            src={img}
                            alt={`${room.name} ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Room Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-4 py-2 bg-primary text-primary-foreground font-semibold border-2 border-primary">
                        {room.nameEn || room.name}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-8">
                    {/* Room Title */}
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold text-foreground mb-2">
                        {room.name}
                      </h3>
                      <div className="flex items-center space-x-6 text-muted-foreground">
                        {room.size && (
                          <div className="flex items-center space-x-2">
                            <Maximize2 size={18} className="text-primary" />
                            <span>{room.size}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Users size={18} className="text-primary" />
                          <span>最多 {room.capacity} 人</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Amenities */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground mb-3 tracking-wider">
                        房間設施
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-secondary/50 text-secondary-foreground text-sm border border-border"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">平日價格</p>
                        <p className="text-3xl font-bold text-primary">
                          NT$ {Math.floor(Number(room.price)).toLocaleString()}
                        </p>
                        {room.weekendPrice && (
                          <p className="text-sm text-muted-foreground mt-1">
                            假日 NT$ {Number(room.weekendPrice).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Link href={`/rooms/${room.id}`}>
                          <Button 
                            variant="outline" 
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            查看詳情
                          </Button>
                        </Link>
                        <Link href={`/booking?roomId=${room.id}`}>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            立即訂房
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card/50 relative overflow-hidden">
        <div className="absolute inset-0 geometric-bg" />
        <div className="container mx-auto text-center relative z-10">
          <div className="corner-frame max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              找不到合適的房型？
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              歡迎聯絡我們，我們將為您提供專業的建議與協助
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  聯絡我們
                </Button>
              </Link>
              <button 
                className="px-6 py-3 border-2 border-primary text-primary hover:bg-primary/10 rounded text-lg font-semibold transition-colors"
                onClick={() => window.location.href = "tel:06-6359577"}
              >
                電話訂房：06-635-9577
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
