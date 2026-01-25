import React from 'react';
// @ts-nocheck
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Tag } from "lucide-react";

export default function News() {
  const { data: newsItems, isLoading } = trpc.news.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-20">
          <div className="text-center text-muted-foreground">載入中...</div>
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
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/cz6FcKw42jqQ.jpg"
            alt="News"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-gold-gradient">
              最新消息
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              NEWS & PROMOTIONS
            </p>
          </div>
        </div>
        <div className="absolute inset-0 geometric-bg pointer-events-none opacity-30" />
      </section>

      {/* News List */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl">
          {newsItems && newsItems.length > 0 ? (
            <div className="space-y-8">
              {newsItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-card border-border hover:border-primary transition-all shadow-luxury overflow-hidden group"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Image */}
                    {item.coverImage && (
                      <div className="relative h-64 md:h-auto overflow-hidden">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-card/80 to-transparent" />
                      </div>
                    )}

                    {/* Content */}
                    <CardContent className={`p-8 ${item.coverImage ? "md:col-span-2" : "md:col-span-3"}`}>
                      {/* Meta */}
                      <div className="flex items-center space-x-4 mb-4">
                        <span className={`px-3 py-1 text-xs font-semibold border ${getTypeColor(item.type)}`}>
                          <Tag size={12} className="inline mr-1" />
                          {getTypeLabel(item.type)}
                        </span>
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Calendar size={16} className="mr-2" />
                          {new Date(item.publishDate).toLocaleDateString("zh-TW")}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                      {item.titleEn && (
                        <p className="text-sm text-muted-foreground tracking-wider mb-4">
                          {item.titleEn}
                        </p>
                      )}

                      {/* Content Preview */}
                      <p className="text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                        {item.content}
                      </p>

                      {/* Read More Link */}
                      <Link href={`/news/${item.id}`}>
                        <a className="inline-flex items-center text-primary hover:text-primary/80 font-semibold">
                          閱讀更多
                          <span className="ml-2">→</span>
                        </a>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">目前沒有最新消息</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
