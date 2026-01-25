import React from 'react';
// @ts-nocheck
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Upload, X } from "lucide-react";

type NewsType = "announcement" | "promotion" | "event";

export default function NewsManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement" as NewsType,
    image: "",
  });

  const utils = trpc.useUtils();
  const { data: news, isLoading } = trpc.news.list.useQuery();
  const uploadMutation = trpc.upload.image.useMutation();
  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate();
    },
  });
  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate();
    },
  });
  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate();
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片檔案");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          filename: file.name,
          data: base64,
        });
        setUploadedImage(result.url);
        setFormData({ ...formData, image: result.url });
        toast.success("圖片上傳成功");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("圖片上傳失敗，請重試");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: formData.title,
          content: formData.content,
          type: formData.type,
          image: formData.image,
        });
        toast.success("消息已更新");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          image: formData.image,
        });
        toast.success("消息已新增");
      }

      setFormData({
        title: "",
        content: "",
        type: "announcement",
        image: "",
      });
      setUploadedImage("");
    } catch (error) {
      toast.error("操作失敗，請重試");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      image: item.image || "",
    });
    setUploadedImage(item.image || "");
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此消息嗎？")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("消息已刪除");
      } catch (error) {
        toast.error("刪除失敗，請重試");
      }
    }
  };

  const getTypeLabel = (type: NewsType) => {
    switch (type) {
      case "announcement":
        return "公告";
      case "promotion":
        return "優惠活動";
      case "event":
        return "活動";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {editingId ? "編輯消息" : "新增消息"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              標題 *
            </label>
            <Input
              type="text"
              placeholder="例：春季優惠活動開始"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              內容 *
            </label>
            <Textarea
              placeholder="消息詳細內容"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              類型
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as NewsType,
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
            >
              <option value="announcement">公告</option>
              <option value="promotion">優惠活動</option>
              <option value="event">活動</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              圖片
            </label>
            {uploadedImage && (
              <div className="relative mb-4 w-32 h-32">
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImage("");
                    setFormData({ ...formData, image: "" });
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
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
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {editingId ? "更新消息" : "新增消息"}
                </>
              )}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: "",
                    content: "",
                    type: "announcement",
                    image: "",
                  });
                  setUploadedImage("");
                }}
              >
                取消編輯
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">消息列表</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : news && news.length > 0 ? (
          <div className="space-y-3">
            {news.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getTypeLabel(item.type)} ·{" "}
                        {new Date(item.publishDate).toLocaleDateString("zh-TW")}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            尚無消息資料
          </p>
        )}
      </Card>
    </div>
  );
}
