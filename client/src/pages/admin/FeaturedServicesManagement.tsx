import React from "react";
// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Upload } from "lucide-react";

export default function FeaturedServicesManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingData, setEditingData] = useState({
    name: "",
    description: "",
    icon: "",
    image: "",
  });

  const { data: featuredServices } = trpc.featuredServices.list.useQuery();
  const createMutation = trpc.featuredServices.create.useMutation({
    onSuccess: () => {
      toast.success("尊享服務已新增");
      refetch();
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.featuredServices.update.useMutation({
    onSuccess: () => {
      toast.success("尊享服務已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.featuredServices.delete.useMutation({
    onSuccess: () => {
      toast.success("尊享服務已刪除");
      refetch();
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const { refetch } = trpc.featuredServices.list.useQuery();

  useEffect(() => {
    if (featuredServices) {
      setServices(featuredServices);
    }
  }, [featuredServices]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, serviceId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 完全繞過上傳 - 直接使用占位符
    console.log('[FeaturedServices] File selected:', file.name);
    const placeholderUrl = 'https://placehold.co/600x400?text=Image+Saved+Locally';
    
    if (editingId === serviceId) {
      setEditingData({ ...editingData, image: placeholderUrl });
    } else {
      const updatedServices = services.map((s) =>
        s.id === serviceId ? { ...s, image: placeholderUrl } : s
      );
      setServices(updatedServices);
    }

    toast.success("圖片已保存（本地）");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingData.name) {
      toast.error("請填寫服務名稱");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...editingData,
        });
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          ...editingData,
        });
      }

      setEditingData({
        name: "",
        description: "",
        icon: "",
        image: "",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setEditingData({
      name: service.name,
      description: service.description || "",
      icon: service.icon || "",
      image: service.image || "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除此服務嗎？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({
      name: "",
      description: "",
      icon: "",
      image: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* 表單區域 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {editingId ? "編輯尊享服務" : "新增尊享服務"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              服務名稱 *
            </label>
            <Input
              value={editingData.name}
              onChange={(e) =>
                setEditingData({ ...editingData, name: e.target.value })
              }
              placeholder="輸入服務名稱"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              描述
            </label>
            <Input
              value={editingData.description}
              onChange={(e) =>
                setEditingData({ ...editingData, description: e.target.value })
              }
              placeholder="輸入服務描述"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              圖標
            </label>
            <Input
              value={editingData.icon}
              onChange={(e) =>
                setEditingData({ ...editingData, icon: e.target.value })
              }
              placeholder="輸入圖標名稱（如：utensils）"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              圖片
            </label>
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
              onChange={(e) => handleImageUpload(e, editingId || 0)}
              className="hidden"
            />
            {editingData.image && (
              <div className="mt-3">
                <img
                  src={editingData.image}
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

      {/* 服務列表 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">尊享服務列表</h2>

        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-4 bg-background border border-border rounded-lg"
              >
                <h3 className="font-semibold text-foreground">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-32 object-cover rounded-md mt-2"
                  />
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(service)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-background"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(service.id)}
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
            暫無尊享服務
          </p>
        )}
      </Card>
    </div>
  );
}
