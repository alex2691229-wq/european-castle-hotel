import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RefreshCw, Save, X, Edit3, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { wsManager, RoomAvailabilityEvent } from "@/lib/websocket";

// Booking.com 風格的多房型並排比較視圖
export default function RoomComparisonView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{ roomTypeId: number; date: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMaxQuantity, setEditMaxQuantity] = useState<number>(10);
  const [editWeekdayPrice, setEditWeekdayPrice] = useState<string>("");
  const [editWeekendPrice, setEditWeekendPrice] = useState<string>("");
  const [editIsOpen, setEditIsOpen] = useState(true);

  // 數據查詢
  const { data: roomTypes = [] } = trpc.roomTypes.list.useQuery();

  // 計算當前月份的日期範圍
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // 為所有房型獲取可用性記錄
  const availabilityQueries = roomTypes.map(room => {
    return trpc.roomAvailability.getByRoomAndDateRange.useQuery(
      {
        roomTypeId: room.id,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
      { enabled: true }
    );
  });

  // 合併所有房型的可用性數據
  const allAvailabilityRecords = useMemo(() => {
    const records: Record<number, any[]> = {};
    roomTypes.forEach((room, index) => {
      records[room.id] = availabilityQueries[index]?.data || [];
    });
    return records;
  }, [roomTypes, availabilityQueries]);

  // 刷新所有數據
  const refetchAll = () => {
    availabilityQueries.forEach(query => query.refetch());
  };

  // WebSocket 監聽
  useEffect(() => {
    if (!wsManager.isConnected()) {
      wsManager.connect().catch(console.error);
    }

    const handleRoomAvailabilityChanged = (event: RoomAvailabilityEvent) => {
      refetchAll();
    };

    wsManager.on('room_availability_changed', handleRoomAvailabilityChanged as any);
    return () => {
      wsManager.off('room_availability_changed', handleRoomAvailabilityChanged as any);
    };
  }, []);

  // Mutations
  const updateMaxSalesQuantityMutation = trpc.roomAvailability.updateMaxSalesQuantity.useMutation({
    onSuccess: () => {
      refetchAll();
      toast.success("可銷售數量已更新");
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const updateDynamicPriceMutation = trpc.roomAvailability.updateDynamicPrice.useMutation({
    onSuccess: () => {
      refetchAll();
      toast.success("價格已更新");
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const setAvailabilityMutation = trpc.roomAvailability.setAvailability.useMutation({
    onSuccess: () => {
      refetchAll();
      toast.success("可用性已更新");
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // 日期格式化
  const formatDateSafe = (date: Date | string | null | undefined): string | null => {
    try {
      if (!date) return null;
      const d = date instanceof Date ? date : new Date(String(date));
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // 生成日曆日期（只生成當月的日期）
  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    
    return dates;
  }, [currentMonth]);

  // 獲取日期的可用性狀態
  const getDateStatus = (roomTypeId: number, date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return { status: 'unknown', maxQty: 10, bookedQty: 0, price: null };

    const records = allAvailabilityRecords[roomTypeId] || [];
    const record = records.find(r => formatDateSafe(r.date) === dateStr);
    const maxQty = record?.maxSalesQuantity ?? 10;
    const bookedQty = record?.bookedQuantity ?? 0;
    const isBlocked = record?.isAvailable === false;
    
    // 計算價格
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const selectedRoom = roomTypes.find(r => r.id === roomTypeId);
    
    let price: number | null = null;
    if (isWeekend) {
      price = record?.weekendPrice 
        ? (typeof record.weekendPrice === 'string' ? parseInt(record.weekendPrice) : record.weekendPrice)
        : (selectedRoom?.weekendPrice 
          ? (typeof selectedRoom.weekendPrice === 'string' ? parseInt(selectedRoom.weekendPrice) : selectedRoom.weekendPrice)
          : (selectedRoom?.price 
            ? (typeof selectedRoom.price === 'string' ? parseInt(selectedRoom.price) : selectedRoom.price)
            : null));
    } else {
      price = record?.weekdayPrice 
        ? (typeof record.weekdayPrice === 'string' ? parseInt(record.weekdayPrice) : record.weekdayPrice)
        : (selectedRoom?.price 
          ? (typeof selectedRoom.price === 'string' ? parseInt(selectedRoom.price) : selectedRoom.price)
          : null);
    }

    let status: 'available' | 'limited' | 'soldout' | 'closed' | 'past' = 'available';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      status = 'past';
    } else if (isBlocked || maxQty === 0) {
      status = 'closed';
    } else if (bookedQty >= maxQty) {
      status = 'soldout';
    } else if (bookedQty > 0) {
      status = 'limited';
    }

    return { status, maxQty, bookedQty, price, isWeekend };
  };

  // 點擊單元格
  const handleCellClick = (roomTypeId: number, date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return;
    
    const { status, maxQty, price } = getDateStatus(roomTypeId, date);
    if (status === 'past') return;

    setSelectedCell({ roomTypeId, date: dateStr });
    setEditMaxQuantity(maxQty);
    setEditWeekdayPrice("");
    setEditWeekendPrice("");
    setEditIsOpen(status !== 'closed');
    setEditDialogOpen(true);
  };

  // 保存編輯
  const handleSaveEdit = async () => {
    if (!selectedCell) return;

    const { roomTypeId, date: dateStr } = selectedCell;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    try {
      // 更新可用性狀態
      await setAvailabilityMutation.mutateAsync({
        roomTypeId,
        dates: [date],
        isAvailable: editIsOpen,
        reason: editIsOpen ? undefined : "管理員關閉預訂",
      });

      // 更新可銷售數量
      await updateMaxSalesQuantityMutation.mutateAsync({
        roomTypeId,
        date,
        maxSalesQuantity: editMaxQuantity,
      });

      // 更新價格
      if (editWeekdayPrice || editWeekendPrice) {
        await updateDynamicPriceMutation.mutateAsync({
          roomTypeId,
          date,
          weekdayPrice: editWeekdayPrice ? parseInt(editWeekdayPrice) : undefined,
          weekendPrice: editWeekendPrice ? parseInt(editWeekendPrice) : undefined,
        });
      }

      setEditDialogOpen(false);
      setSelectedCell(null);
    } catch (error) {
      toast.error("更新失敗，請重試");
    }
  };

  // 月份導航
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 生成月份選項
  const monthYearOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      options.push(date);
    }
    return options;
  }, []);

  const handleMonthYearChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setCurrentMonth(new Date(year, month, 1));
  };

  const currentMonthYearValue = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  // 獲取狀態顏色樣式
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'available':
        return "bg-emerald-900/50 text-emerald-100 border-emerald-600/30";
      case 'limited':
        return "bg-amber-900/50 text-amber-100 border-amber-600/30";
      case 'soldout':
        return "bg-red-900/50 text-red-300 border-red-600/30";
      case 'closed':
        return "bg-gray-800/70 text-gray-400 border-gray-600/30";
      case 'past':
        return "bg-gray-900/50 text-gray-600 border-gray-700/30";
      default:
        return "bg-slate-800/50 text-slate-300 border-slate-600/30";
    }
  };

  // 手動刷新
  const handleRefresh = () => {
    refetchAll();
    toast.success("已刷新數據");
  };

  return (
    <div className="space-y-4">
      {/* 標題和說明 */}
      <div>
        <h2 className="text-2xl font-bold text-gold mb-2">多房型比較視圖</h2>
        <p className="text-gray-400 text-sm">
          在同一個日曆上查看所有房型的價格和庫存狀況，點擊單元格可編輯
        </p>
      </div>

      {/* 月份導航 */}
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={currentMonthYearValue} onValueChange={handleMonthYearChange}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-64">
                  {monthYearOptions.map((date) => {
                    const value = `${date.getFullYear()}-${date.getMonth()}`;
                    const label = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                    return (
                      <SelectItem key={value} value={value} className="text-white hover:bg-slate-700">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* 狀態圖例 */}
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-900/60 border border-emerald-500/50"></div>
                <span className="text-gray-400">可預訂</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-900/60 border border-amber-500/50"></div>
                <span className="text-gray-400">部分已訂</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-900/60 border border-red-500/50"></div>
                <span className="text-gray-400">已訂滿</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-800 border border-gray-600"></div>
                <span className="text-gray-400">已關閉</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 比較表格 */}
      <Card className="bg-slate-900/80 border-slate-700 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max bg-slate-900">
              <thead>
                <tr className="bg-slate-800">
                  <th className="sticky left-0 z-10 bg-slate-800 border-b border-r border-slate-700 p-2 text-left text-sm font-semibold text-gold min-w-[140px]">
                    房型
                  </th>
                  {calendarDates.map((date, index) => {
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const weekDayNames = ["日", "一", "二", "三", "四", "五", "六"];
                    return (
                      <th 
                        key={index} 
                        className={`border-b border-slate-700 p-1 text-center min-w-[60px] bg-slate-800 ${
                          isWeekend ? 'bg-amber-900/30' : ''
                        }`}
                      >
                        <div className={`text-xs font-medium ${isWeekend ? 'text-amber-400' : 'text-gray-400'}`}>
                          {weekDayNames[dayOfWeek]}
                        </div>
                        <div className={`text-sm font-semibold ${isWeekend ? 'text-amber-300' : 'text-white'}`}>
                          {date.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-800/30">
                    <td className="sticky left-0 z-10 bg-slate-900 border-b border-r border-slate-700 p-2">
                      <div className="text-sm font-medium text-white truncate max-w-[130px]" title={room.name}>
                        {room.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        基礎價: ${room.price?.toLocaleString()}
                      </div>
                    </td>
                    {calendarDates.map((date, index) => {
                      const { status, maxQty, bookedQty, price, isWeekend } = getDateStatus(room.id, date);
                      const remaining = Math.max(0, maxQty - bookedQty);
                      
                      return (
                        <td 
                          key={index}
                          className={`border-b border-slate-700/50 p-0.5 bg-slate-900 ${isWeekend ? 'bg-amber-900/20' : ''}`}
                        >
                          <button
                            onClick={() => handleCellClick(room.id, date)}
                            disabled={status === 'past'}
                            className={`w-full h-full p-1 rounded text-center transition-all ${getStatusStyles(status)}
                              ${status !== 'past' ? 'hover:ring-1 hover:ring-gold/50 cursor-pointer' : 'cursor-not-allowed'}
                            `}
                          >
                            {status !== 'past' && (
                              <>
                                <div className="text-[10px] font-medium text-gold">
                                  ${price?.toLocaleString() || '-'}
                                </div>
                                <div className="text-[9px] opacity-80">
                                  {bookedQty}/{maxQty}
                                </div>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-gold">
              編輯房間設置
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCell && (
                <>
                  {roomTypes.find(r => r.id === selectedCell.roomTypeId)?.name} - {selectedCell.date}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* 開放/關閉狀態 */}
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">開放預訂</Label>
              <Switch
                checked={editIsOpen}
                onCheckedChange={setEditIsOpen}
              />
            </div>

            {/* 可銷售數量 */}
            <div className="space-y-2">
              <Label className="text-gray-300">可銷售數量</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={editMaxQuantity}
                onChange={(e) => setEditMaxQuantity(parseInt(e.target.value) || 0)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            {/* 價格設置 */}
            <div className="space-y-3 pt-3 border-t border-slate-700">
              <Label className="text-gray-300 text-sm font-medium">價格設置（留空則使用房型基礎價格）</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-xs">平日價格</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="不設定"
                    value={editWeekdayPrice}
                    onChange={(e) => setEditWeekdayPrice(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">假日價格</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="不設定"
                    value={editWeekendPrice}
                    onChange={(e) => setEditWeekendPrice(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
                onClick={() => setEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-gold text-black hover:bg-gold/90 font-semibold"
                onClick={handleSaveEdit}
              >
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
