import React from 'react';
// @ts-nocheck
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Copy, Check } from "lucide-react";

type ImageCategory = "homepage" | "rooms" | "facilities" | "other";

export default function ImageGallery() {
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>("homepage");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.image.useMutation();

  const categories: { value: ImageCategory; label: string }[] = [
    { value: "homepage", label: "首頁輪播" },
    { value: "rooms", label: "房型照片" },
    { value: "facilities", label: "設施照片" },
    { value: "other", label: "其他圖片" },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          if (base64) {
            try {
              const result = await uploadMutation.mutateAsync({
                filename: `${selectedCategory}-${file.name}`,
                data: base64,
              });
              toast.success(`圖片已上傳: ${file.name}`);
            } catch (error) {
              console.error('Upload failed:', error);
              toast.error(`上傳失敗: ${file.name}`);
            }
          }
        };
        reader.readAsDataURL(file);
      }
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
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                上傳中...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                選擇圖片
              </>
            )}
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
        <p className="text-xs text-muted-foreground mt-2">
          支援 JPG、PNG、WebP 等格式，單個文件最大 10MB
        </p>
      </Card>

      {/* Image Gallery */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {categories.find((c) => c.value === selectedCategory)?.label} 圖片庫
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Placeholder - In production, this would fetch from database */}
          <div className="aspect-square bg-background border-2 border-dashed border-border rounded-lg flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              上傳的圖片將顯示在此
            </p>
          </div>
        </div>
      </Card>

      {/* Usage Guide */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">使用說明</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">首頁輪播：</strong>
            用於首頁的輪播圖展示，建議尺寸 1920x1080px
          </p>
          <p>
            <strong className="text-foreground">房型照片：</strong>
            用於房型列表和詳情頁面，建議尺寸 800x600px
          </p>
          <p>
            <strong className="text-foreground">設施照片：</strong>
            用於設施介紹頁面，建議尺寸 600x400px
          </p>
          <p>
            <strong className="text-foreground">其他圖片：</strong>
            其他用途的圖片，如背景圖、裝飾圖等
          </p>
          <p className="mt-4 pt-4 border-t border-border">
            上傳後，您可以在各個頁面的管理介面中選擇使用這些圖片。
          </p>
        </div>
      </Card>
    </div>
  );
}
