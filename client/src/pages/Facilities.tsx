import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Car, Bath, Wifi, Clock, Sparkles, Shield } from "lucide-react";

const iconMap: Record<string, any> = {
  Car,
  Bath,
  Wifi,
  Clock,
  Sparkles,
  Shield,
};

export default function Facilities() {
  const { data: facilities, isLoading } = trpc.facilities.list.useQuery();

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
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/7bImBALYq9l1.jpg"
            alt="Facilities"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-gold-gradient">
              設施服務
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              FACILITIES & SERVICES
            </p>
          </div>
        </div>
        <div className="absolute inset-0 geometric-bg pointer-events-none opacity-30" />
      </section>

      {/* Facilities Grid */}
      <section className="py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16 art-deco-border">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              完善的設施與服務
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              我們致力於為每位賓客提供最優質的住宿體驗，從獨立車庫到豪華衛浴，每個細節都經過精心設計
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities?.map((facility) => {
              const Icon = iconMap[facility.icon || "Sparkles"] || Sparkles;
              
              return (
                <Card 
                  key={facility.id} 
                  className="bg-card border-border hover:border-primary transition-all shadow-luxury group"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      {/* Icon */}
                      <div className="w-20 h-20 border-2 border-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon size={40} className="text-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {facility.name}
                        </h3>
                        {facility.nameEn && (
                          <p className="text-sm text-muted-foreground tracking-wider mb-4">
                            {facility.nameEn}
                          </p>
                        )}
                        <p className="text-muted-foreground leading-relaxed">
                          {facility.description}
                        </p>
                        {facility.descriptionEn && (
                          <p className="text-muted-foreground/70 leading-relaxed mt-3 text-sm">
                            {facility.descriptionEn}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-12 art-deco-border">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              其他貼心服務
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-primary flex items-center justify-center">
                <Sparkles size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">客房清潔</h3>
              <p className="text-muted-foreground">
                每日提供客房清潔服務，確保您的住宿環境整潔舒適
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-primary flex items-center justify-center">
                <Shield size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">安全保障</h3>
              <p className="text-muted-foreground">
                24小時監控系統與專業保全，確保您的人身與財物安全
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-primary flex items-center justify-center">
                <Clock size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">彈性入住</h3>
              <p className="text-muted-foreground">
                提供彈性的入住與退房時間，滿足您的行程安排需求
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
