import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface RoomUpdateData {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price: string;
  weekendPrice: string;
  amenities: string;
  maxSalesQuantity?: number;
}

export default function RoomBatchUpdate() {
  const [rooms, setRooms] = useState<RoomUpdateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: dbRooms } = trpc.roomTypes.list.useQuery();
  const updateMutation = trpc.roomTypes.update.useMutation();
  const utils = trpc.useUtils();

  // 當數據庫房型數據加載時，同步到本地狀態
  useEffect(() => {
    if (dbRooms && dbRooms.length > 0) {
      const formattedRooms = dbRooms.map((room: any) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        capacity: room.capacity,
        price: String(room.price),
        weekendPrice: String(room.weekendPrice || ""),
        amenities: room.amenities || "",
        maxSalesQuantity: room.maxSalesQuantity || 10,
      }));
      setRooms(formattedRooms);
      setIsLoading(false);
    }
  }, [dbRooms]);

  const handleUpdate = async (room: RoomUpdateData) => {
    try {
      await updateMutation.mutateAsync({
        id: room.id,
        name: room.name,
        description: room.description,
        capacity: room.capacity,
        price: room.price,
        weekendPrice: room.weekendPrice,
        amenities: room.amenities,
        maxSalesQuantity: room.maxSalesQuantity || 10,
      });
      toast.success(`${room.name} 已更新`);
      // 刷新房型列表
      utils.roomTypes.list.invalidate();
    } catch (error) {
      toast.error(`更新失敗: ${room.name}`);
      console.error(error);
    }
  };

  const handleBatchUpdate = async () => {
    try {
      for (const room of rooms) {
        await updateMutation.mutateAsync({
          id: room.id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          price: room.price,
          weekendPrice: room.weekendPrice,
          amenities: room.amenities,
          maxSalesQuantity: room.maxSalesQuantity || 10,
        });
      }
      toast.success("所有房型已批量更新！");
      // 刷新房型列表
      utils.roomTypes.list.invalidate();
    } catch (error) {
      toast.error("批量更新失敗");
      console.error(error);
    }
  };

  const handleRoomChange = (index: number, field: keyof RoomUpdateData, value: any) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">房型批量更新</h3>
        <Button
          onClick={handleBatchUpdate}
          disabled={updateMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {updateMutation.isPending ? "更新中..." : "批量更新所有房型"}
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card className="p-6 bg-card border-border">
          <p className="text-center text-muted-foreground">暫無房型數據</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rooms.map((room, index) => (
            <Card key={room.id} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{room.name}</span>
                  <Button
                    onClick={() => handleUpdate(room)}
                    disabled={updateMutation.isPending}
                    size="sm"
                    variant="outline"
                  >
                    {updateMutation.isPending ? "更新中..." : "更新此房型"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${room.id}`}>房型名稱</Label>
                    <Input
                      id={`name-${room.id}`}
                      value={room.name}
                      onChange={(e) => handleRoomChange(index, "name", e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`capacity-${room.id}`}>容納人數</Label>
                    <Input
                      id={`capacity-${room.id}`}
                      type="number"
                      value={room.capacity}
                      onChange={(e) => handleRoomChange(index, "capacity", parseInt(e.target.value))}
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${room.id}`}>房型描述</Label>
                  <Textarea
                    id={`description-${room.id}`}
                    value={room.description}
                    onChange={(e) => handleRoomChange(index, "description", e.target.value)}
                    className="bg-background border-border min-h-20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`price-${room.id}`}>平日價格</Label>
                    <Input
                      id={`price-${room.id}`}
                      value={room.price}
                      onChange={(e) => handleRoomChange(index, "price", e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`weekendPrice-${room.id}`}>假日價格</Label>
                    <Input
                      id={`weekendPrice-${room.id}`}
                      value={room.weekendPrice}
                      onChange={(e) => handleRoomChange(index, "weekendPrice", e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`maxSalesQuantity-${room.id}`}>最大可銷售數量</Label>
                    <Input
                      id={`maxSalesQuantity-${room.id}`}
                      type="number"
                      value={room.maxSalesQuantity || 10}
                      onChange={(e) => handleRoomChange(index, "maxSalesQuantity", parseInt(e.target.value))}
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`amenities-${room.id}`}>設施（用逗號分隔）</Label>
                  <Textarea
                    id={`amenities-${room.id}`}
                    value={room.amenities}
                    onChange={(e) => handleRoomChange(index, "amenities", e.target.value)}
                    className="bg-background border-border min-h-16"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
