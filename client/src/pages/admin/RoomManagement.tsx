import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Upload, X, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";

export default function RoomManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "2",
    price: "",
    weekendPrice: "",
    amenities: "",
    maxSalesQuantity: "10",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const { data: rooms, isLoading } = trpc.roomTypes.listAll.useQuery();
  const createMutation = trpc.roomTypes.create.useMutation({
    onSuccess: () => {
      utils.roomTypes.listAll.invalidate();
      setHasUnsavedChanges(false);
      toast.success('房型已成功創建 ✓');
    },
    onError: (error) => {
      toast.error(`創建失敗：${error.message}`);
    },
  });
  const updateMutation = trpc.roomTypes.update.useMutation({
    onSuccess: () => {
      utils.roomTypes.listAll.invalidate();
      setHasUnsavedChanges(false);
      toast.success('房型已成功更新 ✓');
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });
  const deleteMutation = trpc.roomTypes.delete.useMutation({
    onSuccess: () => {
      utils.roomTypes.listAll.invalidate();
      toast.success("房型已刪除");
    },
    onError: () => {
      toast.error("刪除失敗，請重試");
    },
  });
  const uploadMutation = trpc.upload.image.useMutation();

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
                filename: file.name,
                data: base64,
              });
              setUploadedImages((prev) => [...prev, result.url]);
            } catch (error) {
              console.error('Upload failed:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.weekendPrice) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    try {
      const images = uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : undefined;

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          description: formData.description,
          capacity: parseInt(formData.capacity),
          price: formData.price,
          weekendPrice: formData.weekendPrice,
          amenities: formData.amenities,
          maxSalesQuantity: parseInt(formData.maxSalesQuantity),
          images,
        });
        toast.success("房型已更新");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          capacity: parseInt(formData.capacity),
          price: formData.price,
          weekendPrice: formData.weekendPrice,
          amenities: formData.amenities,
          maxSalesQuantity: parseInt(formData.maxSalesQuantity),
          images,
        });
        toast.success("房型已新增");
      }

      setFormData({
        name: "",
        description: "",
        capacity: "2",
        price: "",
        weekendPrice: "",
        amenities: "",
        maxSalesQuantity: "10",
      });
      setUploadedImages([]);
      setOriginalImages([]);
    } catch (error) {
      toast.error("操作失敗，請重試");
    }
  };

  const handleEdit = (room: any) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      description: room.description,
      capacity: String(room.capacity),
      price: room.price,
      weekendPrice: room.weekendPrice || "",
      amenities: room.amenities || "",
      maxSalesQuantity: String(room.maxSalesQuantity || 10),
    });
    const images = room.images ? JSON.parse(room.images) : [];
    setUploadedImages(images);
    setOriginalImages(images);
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此房型嗎？")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleMoveUp = async (id: number) => {
    if (!rooms) return;
    const index = rooms.findIndex((r: any) => r.id === id);
    if (index <= 0) return;
    
    const currentRoom = rooms[index];
    const previousRoom = rooms[index - 1];
    
    try {
      // 交換 displayOrder
      await updateMutation.mutateAsync({
        id: currentRoom.id,
        displayOrder: previousRoom.displayOrder,
      });
      await updateMutation.mutateAsync({
        id: previousRoom.id,
        displayOrder: currentRoom.displayOrder,
      });
      
      // 刷新列表
      await utils.roomTypes.list.invalidate();
      toast.success('房型順序已更新');
    } catch (error) {
      toast.error('更新順序失敗，請重試');
    }
  };

  const handleMoveDown = async (id: number) => {
    if (!rooms) return;
    const index = rooms.findIndex((r: any) => r.id === id);
    if (index < 0 || index >= rooms.length - 1) return;
    
    const currentRoom = rooms[index];
    const nextRoom = rooms[index + 1];
    
    try {
      // 交換 displayOrder
      await updateMutation.mutateAsync({
        id: currentRoom.id,
        displayOrder: nextRoom.displayOrder,
      });
      await updateMutation.mutateAsync({
        id: nextRoom.id,
        displayOrder: currentRoom.displayOrder,
      });
      
      // 刷新列表
      await utils.roomTypes.list.invalidate();
      toast.success('房型順序已更新');
    } catch (error) {
      toast.error('更新順序失敗，請重試');
    }
  };

  const handleToggleAvailability = async (id: number, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        isAvailable: !currentStatus,
      });
      
      // 刷新列表
      await utils.roomTypes.list.invalidate();
      toast.success(currentStatus ? '房型已停用' : '房型已啟用');
    } catch (error) {
      toast.error('更新狀態失敗，請重試');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {editingId ? "編輯房型" : "新增房型"}
        </h2>
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>⚠️ 您有未保存的變更</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              房型名稱 *
            </label>
            <Input
              type="text"
              placeholder="例：豪華雙人房"
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData({ ...formData, name: newName });
                setHasUnsavedChanges(true);
                
                // 實時驗證：檢查重複房型名稱
                if (newName && rooms) {
                  const duplicate = rooms.find(
                    (room: any) => room.name === newName && room.id !== editingId
                  );
                  if (duplicate) {
                    setValidationErrors(prev => ({
                      ...prev,
                      name: '⚠️ 該房型名稱已存在'
                    }));
                  } else {
                    setValidationErrors(prev => {
                      const { name, ...rest } = prev;
                      return rest;
                    });
                  }
                }
              }}
              className={`bg-background border-border text-foreground ${
                validationErrors.name ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.name && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              房型描述 *
            </label>
            <Textarea
              placeholder="房型詳細描述"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setHasUnsavedChanges(true);
              }}
              className="bg-background border-border text-foreground"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length} 字元
              {formData.description.length < 50 && ' （建議至少 50 字元）'}
              {formData.description.length > 200 && ' （建議不超過 200 字元）'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                容納人數
              </label>
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: e.target.value,
                  })
                }
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                平日價格（元/晚）*
              </label>
              <Input
                type="text"
                placeholder="例：2500"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, price: value });
                  setHasUnsavedChanges(true);
                  
                  // 實時驗證：價格必須是正數
                  if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                    setValidationErrors(prev => ({
                      ...prev,
                      price: '請輸入有效的正數'
                    }));
                  } else {
                    setValidationErrors(prev => {
                      const { price, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={`bg-background border-border text-foreground ${
                  validationErrors.price ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.price && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                假日價格（元/晚）*
              </label>
              <Input
                type="text"
                placeholder="例：3500"
                value={formData.weekendPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, weekendPrice: value });
                  setHasUnsavedChanges(true);
                  
                  // 實時驗證：價格必須是正數
                  if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                    setValidationErrors(prev => ({
                      ...prev,
                      weekendPrice: '請輸入有效的正數'
                    }));
                  } else {
                    setValidationErrors(prev => {
                      const { weekendPrice, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={`bg-background border-border text-foreground ${
                  validationErrors.weekendPrice ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.weekendPrice && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.weekendPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                最大可銷售數量
              </label>
              <Input
                type="number"
                min="1"
                placeholder="例：10"
                value={formData.maxSalesQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, maxSalesQuantity: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              設施（以逗號分隔）
            </label>
            <Textarea
              placeholder="例：WiFi, 空調, 液晶電視, 迷你吧"
              value={formData.amenities}
              onChange={(e) =>
                setFormData({ ...formData, amenities: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={2}
            />
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              房型照片
            </label>
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10"
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

            {uploadedImages.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">已上傳的照片：</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => setDraggedIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedIndex !== null && draggedIndex !== idx) {
                          const newImages = [...uploadedImages];
                          const [removed] = newImages.splice(draggedIndex, 1);
                          newImages.splice(idx, 0, removed);
                          setUploadedImages(newImages);
                          setDraggedIndex(null);
                          toast.success('照片順序已更新');
                        }
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      className="relative group cursor-move"
                    >
                      <img
                        src={img}
                        alt={`房型照片 ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border border-border hover:border-gold transition-colors"
                        onClick={() => setPreviewImage(img)}
                      />
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('確定要删除這張照片嗎？')) {
                            setUploadedImages(uploadedImages.filter((_, i) => i !== idx));
                            toast.success('照片已删除');
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="删除照片"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  提示：拖拽照片可調整順序，點擊照片可放大預覽
                </p>
              </div>
            )}
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
                  {editingId ? "更新房型" : "新增房型"}
                </>
              )}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('您有未保存的變更，確定要放棄嗎？')) {
                    return;
                  }
                  setEditingId(null);
                  setHasUnsavedChanges(false);
                  setValidationErrors({});
                  setFormData({
                    name: "",
                    description: "",
                    capacity: "2",
                    price: "",
                    weekendPrice: "",
                    amenities: "",
                    maxSalesQuantity: "10",
                  });
                  setUploadedImages([]);
                  setOriginalImages([]);
                }}
              >
                取消編輯
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">房型列表</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.map((room: any) => {
              const images = room.images ? JSON.parse(room.images) : [];
              const imageCount = images.length;
              const lastUpdated = room.updatedAt ? new Date(room.updatedAt).toLocaleDateString('zh-TW') : '未知';
              
              return (
                <div
                  key={room.id}
                  className="p-4 bg-background border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground text-lg">{room.name}</h3>
                        {/* 狀態標籤 */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          room.isAvailable 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}>
                          {room.isAvailable ? '✅ 已啟用' : '❌ 已停用'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {room.capacity} 人 · 最多 {room.maxSalesQuantity || 10} 間
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* 啟用/停用開關 */}
                      <Button
                        size="sm"
                        variant={room.isAvailable ? "default" : "outline"}
                        onClick={() => handleToggleAvailability(room.id, room.isAvailable)}
                        title={room.isAvailable ? '點擊停用' : '點擊啟用'}
                        className={room.isAvailable ? 'bg-green-600 hover:bg-green-700' : 'border-gray-400'}
                      >
                        {room.isAvailable ? '啟用中' : '已停用'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveUp(room.id)}
                        disabled={rooms.indexOf(room) === 0}
                        title="上移"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveDown(room.id)}
                        disabled={rooms.indexOf(room) === rooms.length - 1}
                        title="下移"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(room)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(room.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 價格信息 */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">平日價格</p>
                      <p className="text-lg font-bold text-blue-800">NT${room.price}</p>
                      <p className="text-xs text-blue-600">/晚</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-600 mb-1">假日價格</p>
                      <p className="text-lg font-bold text-green-800">NT${room.weekendPrice || room.price}</p>
                      <p className="text-xs text-green-600">/晚</p>
                    </div>
                  </div>
                  
                  {/* 附加信息 */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>📷 {imageCount} 張照片</span>
                    <span>·</span>
                    <span>📅 最後編輯：{lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            尚無房型資料
          </p>
        )}
      </Card>

      {/* 照片預覽對話框 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={previewImage}
              alt="照片預覽"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
              title="關閉"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
