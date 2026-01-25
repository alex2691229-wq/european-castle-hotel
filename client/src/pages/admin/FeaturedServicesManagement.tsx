// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X, Edit2, Save, Plus } from "lucide-react";

export default function FeaturedServicesManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: featuredServices, isLoading } = trpc.featuredServices.list.useQuery();
  const uploadMutation = trpc.upload.image.useMutation();
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
      setEditingId(null);
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

    setIsUploading(true);
    setUploadingId(serviceId);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        if (base64) {
          try {
            const result = await uploadMutation.mutateAsync({
              filename: file.name,
              data: base64,
            });

            // Update the service with the new image
            if (editingId === serviceId) {
              setEditingData({ ...editingData, image: result.url });
            } else {
              const updatedServices = services.map((s) =>
                s.id === serviceId ? { ...s, image: result.url } : s
              );
              setServices(updatedServices);
            }

            toast.success("圖片已上傳");
          } catch (error) {
            console.error('Upload failed:', error);
            toast.error("圖片上傳失敗");
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      setUploadingId(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setEditingData({ ...service });
  };

  const handleSave = async () => {
    if (!editingId) return;

    await updateMutation.mutateAsync({
      id: editingId,
      title: editingData.title,
      titleEn: editingData.titleEn,
      description: editingData.description,
      descriptionEn: editingData.descriptionEn,
      image: editingData.image,
      displayOrder: editingData.displayOrder,
      isActive: editingData.isActive,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('確定要刪除此尊享服務嗎？')) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleAddNew = async () => {
    await createMutation.mutateAsync({
      title: "新尊享服務",
      description: "請編輯此服務的描述",
      displayOrder: services.length,
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gold">尊享服務管理</h2>
        <Button
          onClick={handleAddNew}
          className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
        >
          <Plus size={16} className="mr-2" />
          新增服務
        </Button>
      </div>

      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id} className="p-6 bg-black/40 border-gold/20">
            {editingId === service.id ? (
              // 編輯模式
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gold/70 mb-2">標題（中文）</label>
                    <input
                      type="text"
                      value={editingData.title || ''}
                      onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                      className="w-full bg-black/50 border border-gold/30 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gold/70 mb-2">標題（英文）</label>
                    <input
                      type="text"
                      value={editingData.titleEn || ''}
                      onChange={(e) => setEditingData({ ...editingData, titleEn: e.target.value })}
                      className="w-full bg-black/50 border border-gold/30 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gold/70 mb-2">描述（中文）</label>
                  <textarea
                    value={editingData.description || ''}
                    onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full bg-black/50 border border-gold/30 rounded px-3 py-2 text-white h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gold/70 mb-2">描述（英文）</label>
                  <textarea
                    value={editingData.descriptionEn || ''}
                    onChange={(e) => setEditingData({ ...editingData, descriptionEn: e.target.value })}
                    className="w-full bg-black/50 border border-gold/30 rounded px-3 py-2 text-white h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gold/70 mb-2">顯示順序</label>
                    <input
                      type="number"
                      value={editingData.displayOrder || 0}
                      onChange={(e) => setEditingData({ ...editingData, displayOrder: parseInt(e.target.value) })}
                      className="w-full bg-black/50 border border-gold/30 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gold/70 mb-2">啟用</label>
                    <input
                      type="checkbox"
                      checked={editingData.isActive !== false}
                      onChange={(e) => setEditingData({ ...editingData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                {editingData.image && (
                  <div className="relative">
                    <img src={editingData.image} alt="Preview" className="w-full h-48 object-cover rounded" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading && uploadingId === service.id}
                    className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 flex-1"
                  >
                    {isUploading && uploadingId === service.id ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        上傳中...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        更換圖片
                      </>
                    )}
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, service.id)}
                    className="hidden"
                  />
                  <Button
                    onClick={handleSave}
                    className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 flex-1"
                  >
                    <Save size={16} className="mr-2" />
                    保存
                  </Button>
                  <Button
                    onClick={() => setEditingId(null)}
                    className="bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/30"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              // 顯示模式
              <div className="flex gap-4">
                {service.image && (
                  <img src={service.image} alt={service.title} className="w-24 h-24 object-cover rounded" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gold">{service.title}</h3>
                  <p className="text-sm text-gold/70">{service.titleEn}</p>
                  <p className="text-sm text-white/70 mt-2">{service.description}</p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleEdit(service)}
                      className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
                    >
                      <Edit2 size={16} className="mr-2" />
                      編輯
                    </Button>
                    <Button
                      onClick={() => handleDelete(service.id)}
                      className="bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/30"
                    >
                      <X size={16} className="mr-2" />
                      刪除
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
