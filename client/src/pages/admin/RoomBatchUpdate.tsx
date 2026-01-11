import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface RoomUpdateData {
  id: number;
  name: string;
  description: string;
  size: string;
  capacity: number;
  price: string;
  weekendPrice: string;
  amenities: string;
}

export default function RoomBatchUpdate() {
  const [rooms, setRooms] = useState<RoomUpdateData[]>([
    {
      id: 1,
      name: "豪華雙人房(車庫房)",
      description: "寬敞舒適的豪華雙人房，配備獨立車庫停車位，提供最高級的住宿體驗",
      size: "28坪",
      capacity: 2,
      price: "1880",
      weekendPrice: "2180",
      amenities: "獨立車庫, 雙人床, 浴缸, 高速WiFi, 空調, 電視",
    },
    {
      id: 2,
      name: "標準雙床房(車庫房)",
      description: "配備兩張單人床的標準房型，附設獨立車庫，適合商務旅客或小家庭",
      size: "24坪",
      capacity: 2,
      price: "1980",
      weekendPrice: "2280",
      amenities: "獨立車庫, 雙單人床, 淋浴間, 高速WiFi, 空調, 電視",
    },
    {
      id: 3,
      name: "標準雙床房(高樓層)",
      description: "位於高樓層的標準雙床房，享受城市美景，提供寧靜舒適的住宿環境",
      size: "24坪",
      capacity: 2,
      price: "1980",
      weekendPrice: "2280",
      amenities: "高樓層景觀, 雙單人床, 淋浴間, 高速WiFi, 空調, 電視",
    },
    {
      id: 4,
      name: "舒適三人房",
      description: "配備1張單人床和1張加大雙人床，適合三人家庭或朋友同行",
      size: "30坪",
      capacity: 3,
      price: "2380",
      weekendPrice: "2880",
      amenities: "1單人床+1加大雙人床, 浴缸, 高速WiFi, 空調, 電視, 冰箱",
    },
    {
      id: 5,
      name: "奢華四人房",
      description: "配備2張加大雙人床的奢華房型，提供最高級的設施和服務，適合家庭旅遊",
      size: "36坪",
      capacity: 4,
      price: "2880",
      weekendPrice: "3280",
      amenities: "2張加大雙人床, 浴缸, 高速WiFi, 空調, 電視, 冰箱, 沙發",
    },
    {
      id: 6,
      name: "四人房－附淋浴",
      description: "配備4張單人床的經濟型四人房，附淋浴間，適合團體或大家庭",
      size: "32坪",
      capacity: 4,
      price: "2980",
      weekendPrice: "3280",
      amenities: "4張單人床, 淋浴間, 高速WiFi, 空調, 電視, 冰箱",
    },
    {
      id: 7,
      name: "家庭房（6位成人）",
      description: "配備2張加大雙人床和2張日式床舖的寬敞家庭房，適合大家庭或多人團體",
      size: "42坪",
      capacity: 6,
      price: "3580",
      weekendPrice: "4180",
      amenities: "2加大雙人床+2日式床舖, 浴缸, 高速WiFi, 空調, 電視, 冰箱, 客廳",
    },
  ]);

  const updateMutation = trpc.roomTypes.update.useMutation();

  const handleUpdate = async (room: RoomUpdateData) => {
    try {
      await updateMutation.mutateAsync({
        id: room.id,
        name: room.name,
        description: room.description,
        size: room.size,
        capacity: room.capacity,
        price: room.price,
        weekendPrice: room.weekendPrice,
        amenities: room.amenities,
      });
      toast.success(`${room.name} 已更新`);
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
          size: room.size,
          capacity: room.capacity,
          price: room.price,
          weekendPrice: room.weekendPrice,
          amenities: room.amenities,
        });
      }
      toast.success("所有房型已批量更新！");
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
                  <Label htmlFor={`size-${room.id}`}>坪數</Label>
                  <Input
                    id={`size-${room.id}`}
                    value={room.size}
                    onChange={(e) => handleRoomChange(index, "size", e.target.value)}
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
                  <Label htmlFor={`capacity-${room.id}`}>容納人數</Label>
                  <Input
                    id={`capacity-${room.id}`}
                    type="number"
                    value={room.capacity}
                    onChange={(e) => handleRoomChange(index, "capacity", parseInt(e.target.value))}
                    className="bg-background border-border"
                  />
                </div>
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
    </div>
  );
}
