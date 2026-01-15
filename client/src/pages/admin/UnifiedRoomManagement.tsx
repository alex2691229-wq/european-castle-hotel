import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, RefreshCw, Save, X, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { wsManager, RoomAvailabilityEvent } from "@/lib/websocket";

// Booking.com 風格的統一房間管理界面
export default function UnifiedRoomManagement() {
  // 狀態管理
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  
  // 批量編輯面板狀態
  const [showBulkEditPanel, setShowBulkEditPanel] = useState(false);
  const [bulkMaxQuantity, setBulkMaxQuantity] = useState<number>(10);
  const [bulkWeekdayPrice, setBulkWeekdayPrice] = useState<string>("");
  const [bulkWeekendPrice, setBulkWeekendPrice] = useState<string>("");
  const [bulkIsOpen, setBulkIsOpen] = useState(true);
  const [applyToWeekdays, setApplyToWeekdays] = useState(true);
  const [applyToWeekends, setApplyToWeekends] = useState(true);

  // 數據查詢
  const { data: roomTypes = [] } = trpc.roomTypes.list.useQuery();
  const utils = trpc.useUtils();

  // 計算當前月份的日期範圍
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // 獲取可用性記錄
  const { data: availabilityRecords = [], refetch: refetchRecords } = trpc.roomAvailability.getByRoomAndDateRange.useQuery(
    {
      roomTypeId: selectedRoomTypeId!,
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
    { enabled: selectedRoomTypeId !== null }
  );

  // 獲取不可用日期
  const { data: unavailableDates = [], refetch: refetchUnavailable } = trpc.roomAvailability.getUnavailableDates.useQuery(
    {
      roomTypeId: selectedRoomTypeId!,
    },
    { enabled: selectedRoomTypeId !== null }
  );

  // WebSocket 監聽
  useEffect(() => {
    if (!wsManager.isConnected()) {
      wsManager.connect().catch(console.error);
    }

    const handleRoomAvailabilityChanged = (event: RoomAvailabilityEvent) => {
      if (event.roomTypeId === selectedRoomTypeId) {
        refetchRecords();
        refetchUnavailable();
      }
    };

    wsManager.on('room_availability_changed', handleRoomAvailabilityChanged as any);
    return () => {
      wsManager.off('room_availability_changed', handleRoomAvailabilityChanged as any);
    };
  }, [selectedRoomTypeId, refetchRecords, refetchUnavailable]);

  // Mutations
  const updateMaxSalesQuantityMutation = trpc.roomAvailability.updateMaxSalesQuantity.useMutation({
    onSuccess: () => {
      refetchRecords();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const updateDynamicPriceMutation = trpc.roomAvailability.updateDynamicPrice.useMutation({
    onSuccess: () => {
      refetchRecords();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const setAvailabilityMutation = trpc.roomAvailability.setAvailability.useMutation({
    onSuccess: () => {
      refetchRecords();
      refetchUnavailable();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // 初始化第一個房型
  useEffect(() => {
    if (!selectedRoomTypeId && roomTypes.length > 0) {
      setSelectedRoomTypeId(roomTypes[0].id);
    }
  }, [roomTypes, selectedRoomTypeId]);

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

  // 生成日曆天數
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // 填充月初空白
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 添加月份中的每一天
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    
    return days;
  }, [currentMonth]);

  // 獲取日期的可用性狀態
  const getDateStatus = (date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return { status: 'unknown', maxQty: 10, bookedQty: 0, price: null };

    const record = availabilityRecords.find(r => formatDateSafe(r.date) === dateStr);
    const maxQty = record?.maxSalesQuantity ?? 10;
    const bookedQty = record?.bookedQuantity ?? 0;
    const isBlocked = record?.isAvailable === false;
    
    // 計算價格
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const selectedRoom = roomTypes.find(r => r.id === selectedRoomTypeId);
    
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

  // 日期選擇處理
  const handleDateClick = (date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return;
    
    const { status } = getDateStatus(date);
    if (status === 'past') return;

    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
    
    if (newSelected.size > 0) {
      setShowBulkEditPanel(true);
    }
  };

  // 拖曳選擇處理
  const handleMouseDown = (date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return;
    
    const { status } = getDateStatus(date);
    if (status === 'past') return;

    setIsDragging(true);
    setDragStartDate(dateStr);
    setSelectedDates(new Set([dateStr]));
  };

  const handleMouseEnter = (date: Date) => {
    if (!isDragging || !dragStartDate) return;
    
    const dateStr = formatDateSafe(date);
    if (!dateStr) return;

    const startDate = new Date(dragStartDate);
    const endDate = date;
    
    const newSelected = new Set<string>();
    const current = new Date(Math.min(startDate.getTime(), endDate.getTime()));
    const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
    
    while (current <= end) {
      const currentStr = formatDateSafe(current);
      if (currentStr) {
        const { status } = getDateStatus(current);
        if (status !== 'past') {
          newSelected.add(currentStr);
        }
      }
      current.setDate(current.getDate() + 1);
    }
    
    setSelectedDates(newSelected);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDate(null);
    if (selectedDates.size > 0) {
      setShowBulkEditPanel(true);
    }
  };

  // 批量保存
  const handleBulkSave = async () => {
    if (selectedDates.size === 0 || !selectedRoomTypeId) {
      toast.error("請先選擇日期");
      return;
    }

    const dates = Array.from(selectedDates).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });

    // 過濾日期（根據平日/假日設置）
    const filteredDates = dates.filter(date => {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend && !applyToWeekends) return false;
      if (!isWeekend && !applyToWeekdays) return false;
      return true;
    });

    if (filteredDates.length === 0) {
      toast.error("沒有符合條件的日期");
      return;
    }

    try {
      // 更新可用性狀態
      if (!bulkIsOpen) {
        await setAvailabilityMutation.mutateAsync({
          roomTypeId: selectedRoomTypeId,
          dates: filteredDates,
          isAvailable: false,
          reason: "管理員關閉預訂",
        });
      } else {
        await setAvailabilityMutation.mutateAsync({
          roomTypeId: selectedRoomTypeId,
          dates: filteredDates,
          isAvailable: true,
        });
      }

      // 更新可銷售數量
      for (const date of filteredDates) {
        await updateMaxSalesQuantityMutation.mutateAsync({
          roomTypeId: selectedRoomTypeId,
          date,
          maxSalesQuantity: bulkMaxQuantity,
        });
      }

      // 更新價格
      if (bulkWeekdayPrice || bulkWeekendPrice) {
        for (const date of filteredDates) {
          await updateDynamicPriceMutation.mutateAsync({
            roomTypeId: selectedRoomTypeId,
            date,
            weekdayPrice: bulkWeekdayPrice ? parseInt(bulkWeekdayPrice) : undefined,
            weekendPrice: bulkWeekendPrice ? parseInt(bulkWeekendPrice) : undefined,
          });
        }
      }

      toast.success(`已成功更新 ${filteredDates.length} 個日期的設置`);
      setSelectedDates(new Set());
      setShowBulkEditPanel(false);
      refetchRecords();
    } catch (error) {
      toast.error("批量更新失敗，請重試");
    }
  };

  // 清除選擇
  const handleClearSelection = () => {
    setSelectedDates(new Set());
    setShowBulkEditPanel(false);
  };

  // 月份導航
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDates(new Set());
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDates(new Set());
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
    setSelectedDates(new Set());
  };

  const currentMonthYearValue = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // 手動刷新
  const handleRefresh = () => {
    refetchRecords();
    refetchUnavailable();
    toast.success("已刷新數據");
  };

  // 獲取狀態顏色樣式
  const getStatusStyles = (status: string, isSelected: boolean) => {
    let bgColor = "";
    let textColor = "";
    let borderColor = "";

    switch (status) {
      case 'available':
        bgColor = "bg-emerald-900/40 hover:bg-emerald-800/50";
        textColor = "text-emerald-100";
        borderColor = "border-emerald-500/30";
        break;
      case 'limited':
        bgColor = "bg-amber-900/40 hover:bg-amber-800/50";
        textColor = "text-amber-100";
        borderColor = "border-amber-500/30";
        break;
      case 'soldout':
        bgColor = "bg-red-900/40";
        textColor = "text-red-300";
        borderColor = "border-red-500/30";
        break;
      case 'closed':
        bgColor = "bg-gray-800/60";
        textColor = "text-gray-400";
        borderColor = "border-gray-600/30";
        break;
      case 'past':
        bgColor = "bg-gray-900/40";
        textColor = "text-gray-600";
        borderColor = "border-gray-700/30";
        break;
      default:
        bgColor = "bg-slate-800/40";
        textColor = "text-slate-300";
        borderColor = "border-slate-600/30";
    }

    if (isSelected) {
      borderColor = "border-gold ring-2 ring-gold";
      bgColor = bgColor.replace("hover:", "") + " scale-95";
    }

    return { bgColor, textColor, borderColor };
  };

  const selectedRoom = roomTypes.find(r => r.id === selectedRoomTypeId);

  return (
    <div className="flex gap-6">
      {/* 主內容區 */}
      <div className="flex-1 space-y-6">
        {/* 標題和說明 */}
        <div>
          <h2 className="text-2xl font-bold text-gold mb-2">可銷售房間管理</h2>
          <p className="text-gray-400 text-sm">
            類似 Booking.com 的日曆管理界面，點擊或拖曳選擇日期，批量設置可銷售數量和價格
          </p>
        </div>

        {/* 房型選擇和月份導航 */}
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* 房型選擇 */}
              <div className="flex items-center gap-3">
                <Label className="text-gray-300 whitespace-nowrap">選擇房型：</Label>
                <Select
                  value={selectedRoomTypeId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedRoomTypeId(Number(value));
                    setSelectedDates(new Set());
                  }}
                >
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="請選擇房型" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {roomTypes.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()} className="text-white hover:bg-slate-700">
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 月份導航 */}
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
            </div>
          </CardContent>
        </Card>

        {/* 狀態圖例 */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-900/60 border border-emerald-500/50"></div>
            <span className="text-gray-400">可預訂</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-900/60 border border-amber-500/50"></div>
            <span className="text-gray-400">部分已訂</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-900/60 border border-red-500/50"></div>
            <span className="text-gray-400">已訂滿</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-800 border border-gray-600"></div>
            <span className="text-gray-400">已關閉</span>
          </div>
        </div>

        {/* 日曆網格 */}
        {selectedRoomTypeId && (
          <Card className="bg-slate-900/80 border-slate-700">
            <CardContent className="p-4">
              <div 
                className="grid grid-cols-7 gap-2"
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 星期標題 */}
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center text-sm font-semibold py-2 ${
                      index === 0 || index === 6 ? 'text-amber-400' : 'text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {/* 日曆日期 */}
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateStr = formatDateSafe(date);
                  const isSelected = dateStr ? selectedDates.has(dateStr) : false;
                  const { status, maxQty, bookedQty, price, isWeekend } = getDateStatus(date);
                  const { bgColor, textColor, borderColor } = getStatusStyles(status, isSelected);
                  const remaining = Math.max(0, maxQty - bookedQty);

                  return (
                    <button
                      key={index}
                      className={`aspect-square rounded-lg border ${borderColor} ${bgColor} ${textColor} 
                        flex flex-col items-center justify-center text-xs transition-all cursor-pointer
                        ${status === 'past' ? 'cursor-not-allowed' : 'hover:ring-1 hover:ring-gold/50'}
                        select-none`}
                      onClick={() => handleDateClick(date)}
                      onMouseDown={() => handleMouseDown(date)}
                      onMouseEnter={() => handleMouseEnter(date)}
                      disabled={status === 'past'}
                    >
                      <span className={`font-bold text-sm ${isWeekend ? 'text-amber-300' : ''}`}>
                        {date.getDate()}
                      </span>
                      {price && status !== 'past' && (
                        <span className="text-gold text-[10px] mt-0.5">
                          ${price.toLocaleString()}
                        </span>
                      )}
                      {status !== 'past' && (
                        <span className="text-[10px] mt-0.5 opacity-80">
                          {bookedQty}/{maxQty}
                        </span>
                      )}
                      {status === 'soldout' && (
                        <span className="text-[9px] text-red-400 font-medium">訂滿</span>
                      )}
                      {status === 'closed' && (
                        <span className="text-[9px] text-gray-500 font-medium">關閉</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 選中房型信息 */}
        {selectedRoom && (
          <Card className="bg-slate-900/80 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedRoom.name}</h3>
                  <p className="text-sm text-gray-400">
                    基礎價格：平日 NT${selectedRoom.price?.toLocaleString()} / 假日 NT${selectedRoom.weekendPrice?.toLocaleString() || selectedRoom.price?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">預設可銷售數量</p>
                  <p className="text-lg font-semibold text-gold">{selectedRoom.maxSalesQuantity || 10} 間</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 批量編輯側邊面板 */}
      {showBulkEditPanel && (
        <div className="w-80 shrink-0">
          <Card className="bg-slate-900/95 border-gold/30 sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gold text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  批量編輯
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-gray-400">
                已選擇 <span className="text-gold font-semibold">{selectedDates.size}</span> 個日期
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 開放/關閉狀態 */}
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">開放預訂</Label>
                <Switch
                  checked={bulkIsOpen}
                  onCheckedChange={setBulkIsOpen}
                />
              </div>

              {/* 可銷售數量 */}
              <div className="space-y-2">
                <Label className="text-gray-300">可銷售數量</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={bulkMaxQuantity}
                  onChange={(e) => setBulkMaxQuantity(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              {/* 價格設置 */}
              <div className="space-y-3 pt-3 border-t border-slate-700">
                <Label className="text-gray-300 text-sm font-medium">價格設置（留空則使用房型基礎價格）</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-400 text-xs">平日價格 (NT$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="不設定"
                      value={bulkWeekdayPrice}
                      onChange={(e) => setBulkWeekdayPrice(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">假日價格 (NT$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="不設定"
                      value={bulkWeekendPrice}
                      onChange={(e) => setBulkWeekendPrice(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 應用範圍 */}
              <div className="space-y-3 pt-3 border-t border-slate-700">
                <Label className="text-gray-300 text-sm font-medium">應用範圍</Label>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400 text-sm">平日（週一至週五）</Label>
                  <Switch
                    checked={applyToWeekdays}
                    onCheckedChange={setApplyToWeekdays}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400 text-sm">假日（週六、週日）</Label>
                  <Switch
                    checked={applyToWeekends}
                    onCheckedChange={setApplyToWeekends}
                  />
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
                  onClick={handleClearSelection}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gold text-black hover:bg-gold/90 font-semibold"
                  onClick={handleBulkSave}
                >
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
