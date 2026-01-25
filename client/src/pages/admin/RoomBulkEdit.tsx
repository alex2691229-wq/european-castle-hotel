// @ts-nocheck
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Save, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RoomTypeEdit {
  id: number;
  name: string;
  description: string;
  price: string;
  weekendPrice: string;
  maxSalesQuantity: number;
  amenities: string;
}

export default function RoomBulkEdit() {
  const { data: roomTypes, isLoading } = trpc.roomTypes.list.useQuery();
  const utils = trpc.useUtils();

  // 狀態管理
  const [editingRooms, setEditingRooms] = useState<Map<number, RoomTypeEdit>>(
    new Map()
  );
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkWeekendPrice, setBulkWeekendPrice] = useState("");
  const [bulkCapacity, setBulkCapacity] = useState("");

  // Mutations
  const updateRoomTypeMutation = trpc.roomTypes.update.useMutation({
    onSuccess: () => {
      utils.roomTypes.list.invalidate();
      toast.success("房型已更新");
      setEditingRooms(new Map());
    },
    onError: (error: any) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // 初始化編輯狀態
  const handleEditRoom = (roomType: any) => {
    const newMap = new Map(editingRooms);
    if (!newMap.has(roomType.id)) {
      newMap.set(roomType.id, {
        id: roomType.id,
        name: roomType.name,
        description: roomType.description || "",
        price: roomType.price || "",
        weekendPrice: roomType.weekendPrice || "",
        maxSalesQuantity: roomType.maxSalesQuantity,
        amenities: roomType.amenities || "",
      });
    }
    setEditingRooms(newMap);
  };

  // 取消編輯
  const handleCancelEdit = (roomId: number) => {
    const newMap = new Map(editingRooms);
    newMap.delete(roomId);
    setEditingRooms(newMap);
  };

  // 保存單個房型
  const handleSaveRoom = (roomId: number) => {
    const edited = editingRooms.get(roomId);
    if (!edited) return;

    updateRoomTypeMutation.mutate({
      id: roomId,
      name: edited.name,
      description: edited.description,
      price: edited.price,
      weekendPrice: edited.weekendPrice,
      maxSalesQuantity: edited.maxSalesQuantity,
      amenities: edited.amenities,
    });
  };

  // 更新編輯狀態
  const handleUpdateEdit = (
    roomId: number,
    field: keyof RoomTypeEdit,
    value: any
  ) => {
    const newMap = new Map(editingRooms);
    const room = newMap.get(roomId);
    if (room) {
      (room as any)[field] = value;
      newMap.set(roomId, room);
      setEditingRooms(newMap);
    }
  };

  // 選擇/取消選擇房型
  const handleToggleSelect = (roomId: number) => {
    const newSet = new Set(selectedRooms);
    if (newSet.has(roomId)) {
      newSet.delete(roomId);
    } else {
      newSet.add(roomId);
    }
    setSelectedRooms(newSet);
  };

  // 全選/取消全選
  const handleToggleSelectAll = () => {
    if (selectedRooms.size === roomTypes?.length) {
      setSelectedRooms(new Set());
    } else {
      const allIds = new Set(roomTypes?.map((r: any) => r.id) || []);
      setSelectedRooms(allIds);
    }
  };

  // 批量應用價格
  const handleBulkApplyPrice = () => {
    if (selectedRooms.size === 0) {
      toast.error("請選擇至少一個房型");
      return;
    }

    let hasError = false;

    if (bulkPrice && isNaN(parseFloat(bulkPrice))) {
      toast.error("基礎價格格式不正確");
      hasError = true;
    }

    if (bulkWeekendPrice && isNaN(parseFloat(bulkWeekendPrice))) {
      toast.error("週末價格格式不正確");
      hasError = true;
    }

    if (hasError) return;

    selectedRooms.forEach((roomId) => {
      const room = roomTypes?.find((r: any) => r.id === roomId);
      if (room) {
        updateRoomTypeMutation.mutate({
          id: roomId,
          name: room.name,
          description: room.description || "",
          price: bulkPrice || room.price || "",
          weekendPrice: bulkWeekendPrice || room.weekendPrice || "",
          maxSalesQuantity: room.maxSalesQuantity,
          amenities: room.amenities || "",
        });
      }
    });

    setBulkPrice("");
    setBulkWeekendPrice("");
    setSelectedRooms(new Set());
    setBulkEditMode(false);
  };

  // 批量應用容量
  const handleBulkApplyCapacity = () => {
    if (selectedRooms.size === 0) {
      toast.error("請選擇至少一個房型");
      return;
    }

    if (!bulkCapacity || isNaN(parseInt(bulkCapacity))) {
      toast.error("容量格式不正確");
      return;
    }

    const capacity = parseInt(bulkCapacity);

    selectedRooms.forEach((roomId) => {
      const room = roomTypes?.find((r: any) => r.id === roomId);
      if (room) {
        updateRoomTypeMutation.mutate({
          id: roomId,
          name: room.name,
          description: room.description || "",
          price: room.price || "",
          weekendPrice: room.weekendPrice || "",
          maxSalesQuantity: capacity,
          amenities: room.amenities || "",
        });
      }
    });

    setBulkCapacity("");
    setSelectedRooms(new Set());
    setBulkEditMode(false);
  };

  return (
    <div className="space-y-6">
      {/* 批量編輯模式切換 */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">房型批量編輯</h2>
          <Button
            variant={bulkEditMode ? "destructive" : "outline"}
            onClick={() => {
              setBulkEditMode(!bulkEditMode);
              setSelectedRooms(new Set());
              setBulkPrice("");
              setBulkWeekendPrice("");
              setBulkCapacity("");
            }}
          >
            {bulkEditMode ? "退出批量模式" : "進入批量模式"}
          </Button>
        </div>
      </Card>

      {/* 批量操作區域 */}
      {bulkEditMode && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            批量操作（已選擇 {selectedRooms.size} 個房型）
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 基礎價格 */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                基礎價格（元/晚）
              </label>
              <Input
                type="number"
                placeholder="輸入價格"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="bg-white text-foreground border-blue-300"
              />
            </div>

            {/* 週末價格 */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                週末價格（元/晚）
              </label>
              <Input
                type="number"
                placeholder="輸入價格"
                value={bulkWeekendPrice}
                onChange={(e) => setBulkWeekendPrice(e.target.value)}
                className="bg-white text-foreground border-blue-300"
              />
            </div>

            {/* 容量 */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                可預訂人數
              </label>
              <Input
                type="number"
                placeholder="輸入人數"
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(e.target.value)}
                className="bg-white text-foreground border-blue-300"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBulkApplyPrice}
              disabled={
                updateRoomTypeMutation.isPending || selectedRooms.size === 0
              }
              className="flex-1"
            >
              {updateRoomTypeMutation.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              應用價格
            </Button>
            <Button
              onClick={handleBulkApplyCapacity}
              disabled={
                updateRoomTypeMutation.isPending || selectedRooms.size === 0
              }
              className="flex-1"
            >
              {updateRoomTypeMutation.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              應用容量
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedRooms(new Set())}
              className="flex-1"
            >
              清除選擇
            </Button>
          </div>
        </Card>
      )}

      {/* 房型列表 */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            房型列表 ({roomTypes?.length || 0})
          </h2>
          {bulkEditMode && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedRooms.size === roomTypes?.length &&
                  roomTypes?.length > 0
                }
                onChange={handleToggleSelectAll}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">全選</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : roomTypes && roomTypes.length > 0 ? (
          <div className="space-y-4">
            {roomTypes.map((roomType: any) => {
              const isEditing = editingRooms.has(roomType.id);
              const editData = editingRooms.get(roomType.id);
              const isSelected = selectedRooms.has(roomType.id);

              return (
                <div
                  key={roomType.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {/* 選擇框 */}
                  {bulkEditMode && (
                    <div className="mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(roomType.id)}
                        className="rounded border-border"
                      />
                    </div>
                  )}

                  {isEditing && editData ? (
                    // 編輯模式
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            房型名稱
                          </label>
                          <Input
                            value={editData.name || ""}
                            onChange={(e) =>
                              handleUpdateEdit(
                                roomType.id,
                                "name",
                                e.target.value
                              )
                            }
                            className="bg-background text-foreground border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            基礎價格
                          </label>
                          <Input
                            type="number"
                            value={editData.price || ""}
                            onChange={(e) =>
                              handleUpdateEdit(
                                roomType.id,
                                "price",
                                e.target.value
                              )
                            }
                            className="bg-background text-foreground border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            週末價格
                          </label>
                          <Input
                            type="number"
                            value={editData.weekendPrice || ""}
                            onChange={(e) =>
                              handleUpdateEdit(
                                roomType.id,
                                "weekendPrice",
                                e.target.value
                              )
                            }
                            className="bg-background text-foreground border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            可預訂人數
                          </label>
                          <Input
                            type="number"
                            value={editData.maxSalesQuantity || ""}
                            onChange={(e) =>
                              handleUpdateEdit(
                                roomType.id,
                                "maxSalesQuantity",
                                parseInt(e.target.value)
                              )
                            }
                            className="bg-background text-foreground border-border"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          描述
                        </label>
                        <textarea
                          value={editData.description || ""}
                          onChange={(e) =>
                            handleUpdateEdit(
                              roomType.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          設施
                        </label>
                        <Input
                          value={editData.amenities || ""}
                          onChange={(e) =>
                            handleUpdateEdit(
                              roomType.id,
                              "amenities",
                              e.target.value
                            )
                          }
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveRoom(roomType.id)}
                          disabled={updateRoomTypeMutation.isPending}
                          className="flex-1"
                        >
                          {updateRoomTypeMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <Save size={14} className="mr-1" />
                          )}
                          保存
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCancelEdit(roomType.id)}
                          className="flex-1"
                        >
                          <X size={14} className="mr-1" />
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // 查看模式
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">
                          {roomType.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">基礎價格</p>
                            <p className="font-medium text-foreground">
                              NT${roomType.price || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">週末價格</p>
                            <p className="font-medium text-foreground">
                              NT${roomType.weekendPrice || roomType.price || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">可預訂人數</p>
                            <p className="font-medium text-foreground">
                              {roomType.maxSalesQuantity} 人
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">容納人數</p>
                            <p className="font-medium text-foreground">
                              {roomType.capacity} 人
                            </p>
                          </div>
                        </div>
                        {roomType.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {roomType.description}
                          </p>
                        )}
                      </div>
                      {!bulkEditMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoom(roomType)}
                          className="ml-4"
                        >
                          <Edit2 size={14} className="mr-1" />
                          編輯
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            沒有房型數據
          </div>
        )}
      </Card>
    </div>
  );
}
