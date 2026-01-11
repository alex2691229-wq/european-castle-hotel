import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

export default function RoomManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "2",
    price: "",
    amenities: "",
  });

  const { data: rooms, isLoading } = trpc.roomTypes.list.useQuery();
  const createMutation = trpc.roomTypes.create.useMutation();
  const updateMutation = trpc.roomTypes.update.useMutation();
  const deleteMutation = trpc.roomTypes.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          description: formData.description,
          capacity: parseInt(formData.capacity),
          price: formData.price,
          amenities: formData.amenities,
        });
        toast.success("房型已更新");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          capacity: parseInt(formData.capacity),
          price: formData.price,
          amenities: formData.amenities,
        });
        toast.success("房型已新增");
      }

      setFormData({
        name: "",
        description: "",
        capacity: "2",
        price: "",
        amenities: "",
      });
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
      amenities: room.amenities || "",
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此房型嗎？")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("房型已刪除");
      } catch (error) {
        toast.error("刪除失敗，請重試");
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {editingId ? "編輯房型" : "新增房型"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              房型名稱 *
            </label>
            <Input
              type="text"
              placeholder="例：豪華雙人房"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              房型描述 *
            </label>
            <Textarea
              placeholder="房型詳細描述"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={4}
            />
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
                價格（元/晚）*
              </label>
              <Input
                type="text"
                placeholder="例：2500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
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
                  setEditingId(null);
                  setFormData({
                    name: "",
                    description: "",
                    capacity: "2",
                    price: "",
                    amenities: "",
                  });
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
            {rooms.map((room: any) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {room.capacity} 人 · NT${room.price}/晚
                  </p>
                </div>
                <div className="flex gap-2">
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
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            尚無房型資料
          </p>
        )}
      </Card>
    </div>
  );
}
