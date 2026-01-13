import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Tag, ArrowLeft } from "lucide-react";

export default function NewsDetail() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { data: newsItem, isLoading } = trpc.news.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-20">
          <div className="text-center text-muted-foreground">載入中...</div>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-20">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-4">文章不存在</p>
            <Button onClick={() => navigate("/news")}>返回最新消息</Button>
          </div>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "promotion":
        return "優惠活動";
      case "event":
        return "活動公告";
      case "announcement":
      default:
        return "最新消息";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "promotion":
        return "bg-primary/20 text-primary border-primary";
      case "event":
        return "bg-blue-500/20 text-blue-400 border-blue-500";
      case "announcement":
      default:
        return "bg-secondary/50 text-secondary-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      {newsItem.coverImage && (
        <section className="relative h-96 flex items-center justify-center">
          <div className="absolute inset-0">
            <img
              src={newsItem.coverImage}
              alt={newsItem.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative z-10 text-center max-w-4xl px-4">
            <div className="corner-frame">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-gold-gradient">
                {newsItem.title}
              </h1>
              {newsItem.titleEn && (
                <p className="text-lg text-muted-foreground tracking-wider">
                  {newsItem.titleEn}
                </p>
              )}
            </div>
          </div>
          <div className="absolute inset-0 geometric-bg pointer-events-none opacity-30" />
        </section>
      )}

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-card border-border shadow-luxury">
            <CardContent className="p-8 md:p-12">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-border">
                <span className={`px-3 py-1 text-xs font-semibold border ${getTypeColor(newsItem.type)}`}>
                  <Tag size={12} className="inline mr-1" />
                  {getTypeLabel(newsItem.type)}
                </span>
                <span className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={16} className="mr-2" />
                  {new Date(newsItem.publishDate).toLocaleDateString("zh-TW")}
                </span>
              </div>

              {/* Title */}
              {!newsItem.coverImage && (
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                    {newsItem.title}
                  </h1>
                  {newsItem.titleEn && (
                    <p className="text-lg text-muted-foreground tracking-wider">
                      {newsItem.titleEn}
                    </p>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {newsItem.content}
                </p>
              </div>

              {/* Back Button */}
              <div className="mt-12 pt-8 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => navigate("/news")}
                  className="inline-flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  返回最新消息
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
