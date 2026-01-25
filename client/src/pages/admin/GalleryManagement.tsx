import React from 'react';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react";

export default function GalleryManagement() {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // 驗證文件類型
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} 不是圖片文件`);
          continue;
        }

        // 驗證文件大小（最大 10MB）
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} 超過 10MB 限制`);
          continue;
        }

        // 這裡應該調用上傳 API
        // 暫時使用本地 URL 作示例
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          setImages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              url,
              name: file.name,
            },
          ]);
          toast.success(`${file.name} 上傳成功`);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      toast.error("上傳失敗，請重試");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此圖片嗎？")) {
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("圖片已刪除");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">上傳圖片</h2>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground mb-2">拖放圖片或點擊選擇</p>
            <p className="text-sm text-muted-foreground mb-4">
              支持 JPG、PNG、WebP 等格式，單個文件最大 10MB
            </p>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                disabled={uploading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                onClick={() =>
                  document.getElementById("file-upload")?.click()
                }
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    上傳中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    選擇圖片
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          圖片庫 ({images.length})
        </h2>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden bg-background border border-border"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground p-2 truncate">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            尚無圖片，請上傳圖片
          </p>
        )}
      </Card>
    </div>
  );
}
