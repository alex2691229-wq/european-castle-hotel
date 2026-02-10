import React from 'react';
// @ts-nocheck
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Upload, X, AlertCircle } from "lucide-react";

function RoomManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
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

  const utils = trpc.useUtils();
  const { data: rooms, isLoading } = trpc.roomTypes.list.useQuery();
  
  const createMutation = trpc.roomTypes.create.useMutation({
    onSuccess: () => {
      utils.roomTypes.list.invalidate();
      resetForm();
      toast.success('房型已成功創建 ✓');
    },
    onError: (error) => {
      toast.error(`創建失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.roomTypes.update.useMutation({
    onSuccess: () => {
      utils.roomTypes.list.invalidate();
      resetForm();
      toast.success('房型已成功更新 ✓');
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.roomTypes.delete.useMutation({
    onSuccess: () => {
      utils.roomTypes.list.invalidate();
      toast.success("房型已刪除");
    },
    onError: () => {
      toast.error("刪除失敗，請重試");
    },
  });

  /**
   * 使用 POST /api/upload 上傳圖片到 Cloudinary
   * 將圖片轉換為 base64 格式後上傳
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // 驗證檔案類型
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          toast.error(`${file.name} 不是有效的圖片格式`);
          continue;
        }

        // 驗證檔案大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} 超過 5MB 限制`);
          continue;
        }

        try {
          // 將檔案轉換為 base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
          });

          reader.readAsDataURL(file);
          const imageData = await base64Promise;

          toast.loading(`正在上傳 ${file.name}...`);

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData,
              filename: file.name,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || '上傳失敗');
          }

          const data = await response.json();
          if (data.success && data.imageUrl) {
            newUrls.push(data.imageUrl);
            toast.success(`${file.name} 上傳成功 ✓`);
          } else {
            throw new Error(data.message || data.error || '上傳失敗');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '上傳失敗';
          toast.error(`${file.name} 上傳失敗：${errorMsg}`);
          console.error('Upload error:', error);
        }
      }

      setUploadedImages((prev) => [...prev, ...newUrls]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
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
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.weekendPrice) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      capacity: parseInt(formData.capacity),
      price: formData.price,
      weekendPrice: formData.weekendPrice,
      amenities: formData.amenities,
      maxSalesQuantity: parseInt(formData.maxSalesQuantity),
      images: JSON.stringify(uploadedImages),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (room: any) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      description: room.description,
      capacity: room.capacity.toString(),
      price: room.price,
      weekendPrice: room.weekendPrice,
      amenities: room.amenities || "",
      maxSalesQuantity: room.maxSalesQuantity.toString(),
    });
    setUploadedImages(room.images ? JSON.parse(room.images) : []);
  };

  const handleDelete = (id: number) => {
    if (confirm('確定要刪除此房型嗎？')) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">房型管理</h1>
        <Button onClick={() => resetForm()} className="bg-yellow-500 hover:bg-yellow-600">
          <Plus className="w-4 h-4 mr-2" />
          新增房型
        </Button>
      </div>

      {/* 新增/編輯表單 */}
      <Card className="p-6 bg-gray-800 border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">
          {editingId ? '編輯房型' : '新增房型'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="房型名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="容納人數"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <Textarea
            placeholder="房型描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="平日價格"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="假日價格"
              value={formData.weekendPrice}
              onChange={(e) => setFormData({ ...formData, weekendPrice: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <Input
            placeholder="設施（逗號分隔）"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
          />

          {/* 圖片上傳區域 */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
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
            <p className="text-sm text-gray-400 mt-2">支持 JPG、PNG、GIF、WebP，最大 5MB</p>
          </div>

          {/* 已上傳圖片預覽 */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存房型'
              )}
            </Button>
            {editingId && (
              <Button
                type="button"
                onClick={() => resetForm()}
                className="bg-gray-600 hover:bg-gray-700"
              >
                取消編輯
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* 房型列表 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">現有房型</h2>
        {rooms?.map((room) => (
          <Card key={room.id} className="p-4 bg-gray-800 border-gray-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{room.name}</h3>
                <p className="text-gray-400">{room.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-300">
                  <span>容納: {room.capacity} 人</span>
                  <span>平日: NT${room.price}</span>
                  <span>假日: NT${room.weekendPrice}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(room)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(room.id)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default RoomManagement;
