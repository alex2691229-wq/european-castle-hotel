import React from "react";
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

    // 完全繞過上傳 - 直接使用占位符
    console.log('[NewsManagement] File selected:', file.name);
    const placeholderUrl = 'https://placehold.co/600x400?text=Image+Saved+Locally';
    setUploadedImage(placeholderUrl);
    setFormData({ ...formData, image: placeholderUrl });
    toast.success('圖片已保存（本地）');
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

      // 重置表單
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
      type: item.type || "announcement",
      image: item.image || "",
    });
    setUploadedImage(item.image || "");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除此消息嗎？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("消息已刪除");
    } catch (error) {
      toast.error("刪除失敗，請重試");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      type: "announcement",
      image: "",
    });
    setUploadedImage("");
  };

  return (
    <div className="space-y-6">
      {/* 表單區域 */}
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
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="輸入消息標題"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              內容 *
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="輸入消息內容"
              className="bg-background border-border text-foreground"
              rows={5}
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
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
            >
              <option value="announcement">公告</option>
              <option value="promotion">促銷</option>
              <option value="event">活動</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              圖片
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-border text-foreground hover:bg-background"
              >
                <Upload className="w-4 h-4 mr-2" />
                選擇圖片
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {uploadedImage && (
              <div className="mt-3">
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {editingId ? "更新" : "新增"}
            </Button>
            {editingId && (
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="border-border text-foreground hover:bg-background"
              >
                取消
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* 消息列表 */}
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
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(item)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-background"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-background"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            暫無消息
          </p>
        )}
      </Card>
    </div>
  );
}
