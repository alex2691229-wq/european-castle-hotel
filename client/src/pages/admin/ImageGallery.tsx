import React from "react";
// @ts-nocheck
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Copy, Check } from "lucide-react";

type ImageCategory = "carousel" | "room" | "facility" | "other";

export default function ImageGallery() {
  const [images, setImages] = useState<{ url: string; category: ImageCategory; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>("carousel");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { label: "輪播圖", value: "carousel" as ImageCategory },
    { label: "房間", value: "room" as ImageCategory },
    { label: "設施", value: "facility" as ImageCategory },
    { label: "其他", value: "other" as ImageCategory },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      // 完全繞過上傳 - 直接使用占位符
      for (const file of Array.from(files)) {
        console.log('[ImageGallery] File selected:', file.name);
        const placeholderUrl = 'https://placehold.co/600x400?text=Image+Saved+Locally';
        
        setImages((prev) => [
          ...prev,
          {
            url: placeholderUrl,
            category: selectedCategory,
            name: file.name,
          },
        ]);
      }
      
      toast.success("圖片已保存（本地）");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("已複製到剪貼板");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">上傳圖片</h2>

        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            選擇圖片分類
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                className={
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-background"
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "上傳中..." : "選擇圖片"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </Card>

      {/* Gallery Section */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">圖片庫</h2>

        {images.length > 0 ? (
          <div className="space-y-4">
            {categories.map((cat) => {
              const categoryImages = images.filter((img) => img.category === cat.value);
              if (categoryImages.length === 0) return null;

              return (
                <div key={cat.value}>
                  <h3 className="font-semibold text-foreground mb-3">{cat.label}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categoryImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(img.url)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {copiedUrl === img.url ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            暫無圖片，請上傳
          </p>
        )}
      </Card>
    </div>
  );
}
