import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AvailabilityManagement() {
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [maxSalesQuantity, setMaxSalesQuantity] = useState<number>(10);
  const [editingDateForQuantity, setEditingDateForQuantity] = useState<string | null>(null);
  const [weekdayPrice, setWeekdayPrice] = useState<number | undefined>(undefined);
  const [weekendPrice, setWeekendPrice] = useState<number | undefined>(undefined);
  const [batchCloseQuantity, setBatchCloseQuantity] = useState<number>(0);

  // Fetch room types
  const { data: roomTypes = [] } = trpc.roomTypes.list.useQuery();

  // Calculate date range for current month
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Fetch unavailable dates for selected room
  const { data: unavailableDates = [], refetch: refetchUnavailable } = trpc.roomAvailability.getUnavailableDates.useQuery(
    {
      roomTypeId: selectedRoomTypeId!,
    },
    { enabled: selectedRoomTypeId !== null }
  );

  // Fetch availability records (admin settings only)
  const { data: availabilityRecords = [], refetch: refetchRecords } = trpc.roomAvailability.getByRoomAndDateRange.useQuery(
    {
      roomTypeId: selectedRoomTypeId!,
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
    { enabled: selectedRoomTypeId !== null }
  );

  // Set availability mutation
  const setAvailabilityMutation = trpc.roomAvailability.setAvailability.useMutation({
    onSuccess: () => {
      toast.success("房間可用性已更新");
      refetchUnavailable();
      refetchRecords();
      setSelectedDates(new Set());
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // Update max sales quantity mutation
  const updateMaxSalesQuantityMutation = trpc.roomAvailability.updateMaxSalesQuantity.useMutation({
    onSuccess: () => {
      toast.success("可銷售數量已更新");
      refetchRecords();
      setEditingDateForQuantity(null);
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // Update dynamic price mutation
  const updateDynamicPriceMutation = trpc.roomAvailability.updateDynamicPrice.useMutation({
    onSuccess: () => {
      toast.success("房價已更新");
      refetchRecords();
      setWeekdayPrice(undefined);
      setWeekendPrice(undefined);
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // Batch close sales mutation
  const batchCloseSalesMutation = trpc.roomAvailability.updateMaxSalesQuantity.useMutation({
    onSuccess: () => {
      toast.success(`已批量關閉 ${selectedDates.size} 個日期的銷售`);
      refetchRecords();
      setSelectedDates(new Set());
      setBatchCloseQuantity(0);
    },
    onError: (error) => {
      toast.error(`批量操作失敗：${error.message}`);
    },
  });

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Add empty cells for days before month starts
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // 安全的日期格式化函數，防止 Invalid time value 錯誤
  const formatDateSafe = (date: Date | string | null | undefined): string | null => {
    try {
      if (!date) return null;
      const d = date instanceof Date ? date : new Date(String(date));
      if (isNaN(d.getTime())) {
        console.error('Invalid date:', date);
        return null;
      }
      return d.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return null;
    }
  };

  // Check if a date is unavailable (booked or blocked by admin)
  const isDateUnavailable = (date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return false;
    
    return unavailableDates.some(record => {
      // unavailableDates 返回的是 RoomAvailability 對象，不是單純的日期
      const recordDateStr = formatDateSafe(record.date);
      return recordDateStr && recordDateStr === dateStr;
    });
  };

  // Check if a date is blocked by admin (not booked)
  const isDateBlockedByAdmin = (date: Date) => {
    const dateStr = formatDateSafe(date);
    if (!dateStr) return false;
    
    return availabilityRecords.some(record => {
      const recordDateStr = formatDateSafe(record.date);
      return recordDateStr && recordDateStr === dateStr && !record.isAvailable;
    });
  };

  // Check if a date is booked
  const isDateBooked = (date: Date) => {
    return isDateUnavailable(date) && !isDateBlockedByAdmin(date);
  };

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    const dateStr = formatDateSafe(date);
    return dateStr ? selectedDates.has(dateStr) : false;
  };

  // Toggle date selection
  const toggleDateSelection = (date: Date) => {
    // Don't allow selecting booked dates
    if (isDateBooked(date)) {
      toast.error("此日期已有確認訂單，無法修改");
      return;
    }

    const dateStr = formatDateSafe(date);
    if (!dateStr) {
      toast.error("無效的日期");
      return;
    }
    const newSelected = new Set(selectedDates);
    
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    
    setSelectedDates(newSelected);
  };

  // Handle batch close sales
  const handleBatchCloseSales = () => {
    if (selectedDates.size === 0) {
      toast.error("請先選擇要關閉的日期");
      return;
    }

    if (!selectedRoomTypeId) return;

    const dates = Array.from(selectedDates).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
    
    // For each selected date, set maxSalesQuantity to 0
    dates.forEach(date => {
      batchCloseSalesMutation.mutate({
        roomTypeId: selectedRoomTypeId,
        date,
        maxSalesQuantity: 0,
      });
    });
  };

  // Handle batch availability update
  const handleSetAvailability = (isAvailable: boolean) => {
    if (selectedDates.size === 0) {
      toast.error("請先選擇要設定的日期");
      return;
    }

    if (!selectedRoomTypeId) return;

    const dates = Array.from(selectedDates).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
    
    setAvailabilityMutation.mutate({
      roomTypeId: selectedRoomTypeId,
      dates,
      isAvailable,
      reason: isAvailable ? undefined : "管理員關閉預訂",
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDates(new Set());
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDates(new Set());
  };

  // Generate month and year options
  const generateMonthYearOptions = () => {
    const options = [];
    const today = new Date();
    // Generate options for the next 24 months
    for (let i = 0; i < 24; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      options.push(date);
    }
    return options;
  };

  const monthYearOptions = generateMonthYearOptions();

  const handleMonthYearChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setCurrentMonth(new Date(year, month, 1));
    setSelectedDates(new Set());
  };

  const currentMonthYearValue = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gold mb-2">房間可用性管理</h2>
        <p className="text-gray-400">管理每個房型的可預訂日期，點擊日期進行批量設定</p>
      </div>

      <Card className="bg-black/40 border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold">選擇房型</CardTitle>
          <CardDescription className="text-gray-400">
            選擇要管理的房型，然後在日曆上設定可預訂日期
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRoomTypeId?.toString() || ""}
            onValueChange={(value) => {
              setSelectedRoomTypeId(Number(value));
              setSelectedDates(new Set());
            }}
          >
            <SelectTrigger className="bg-black/60 border-gold/30 text-white">
              <SelectValue placeholder="請選擇房型" />
            </SelectTrigger>
            <SelectContent className="bg-black border-gold/30">
              {roomTypes.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()} className="text-white">
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedRoomTypeId && (
        <>
          <Card className="bg-black/40 border-gold/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-gold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    日曆
                  </CardTitle>
                  <Select value={currentMonthYearValue} onValueChange={handleMonthYearChange}>
                    <SelectTrigger className="w-48 bg-black/60 border-gold/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gold/30 max-h-64">
                      {monthYearOptions.map((date) => {
                        const value = `${date.getFullYear()}-${date.getMonth()}`;
                        const label = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                        return (
                          <SelectItem key={value} value={value} className="text-white">
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="bg-black/60 border-gold/30 text-gold hover:bg-gold/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="bg-black/60 border-gold/30 text-gold hover:bg-gold/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-gray-400 flex items-center justify-between">
                <span>點擊日期選擇，然後使用下方按鈐批量設定可用性</span>
                <Button
                  size="sm"
                  onClick={() => setIsSelecting(!isSelecting)}
                  className={isSelecting ? "bg-yellow-500 text-black hover:bg-yellow-600 font-semibold" : "bg-black/60 border border-gold/30 text-gold hover:bg-gold/20"}
                >
                  {isSelecting ? "✕ 退出選擇模式" : "進入批量選擇"}
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gold py-2"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                  const isBooked = isDateBooked(date);
                  const isBlocked = isDateBlockedByAdmin(date);
                  const isSelected = isDateSelected(date);

                  let bgColor = "bg-black/60 hover:bg-gold/20";
                  let textColor = "text-white";
                  let borderColor = "border-gold/30";

                  if (isPast) {
                    bgColor = "bg-gray-800/40";
                    textColor = "text-gray-600";
                  } else if (isBooked) {
                    bgColor = "bg-red-900/40";
                    textColor = "text-red-300";
                    borderColor = "border-red-500/50";
                  } else if (isBlocked) {
                    bgColor = "bg-orange-900/40";
                    textColor = "text-orange-300";
                    borderColor = "border-orange-500/50";
                  }

                  if (isSelected) {
                    borderColor = "border-gold ring-2 ring-gold";
                  }

                  const dateStr = formatDateSafe(date);
                  if (!dateStr) {
                    // 跳過無效日期
                    return null;
                  }
                  const record = availabilityRecords.find(r => formatDateSafe(r.date) === dateStr);
                  const maxQty = record?.maxSalesQuantity || 10;
                  const bookedQty = record?.bookedQuantity || 0;
                  
                  // 計算當天的房價
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const selectedRoomData = roomTypes.find(r => r.id === selectedRoomTypeId);
                  // 根據房型的價格欄位名稱（price 是平日價， weekendPrice 是假日價）
                  const basePrice = isWeekend ? 
                    (typeof selectedRoomData?.weekendPrice === 'string' ? parseInt(selectedRoomData.weekendPrice) : selectedRoomData?.weekendPrice) :
                    (typeof selectedRoomData?.price === 'string' ? parseInt(selectedRoomData.price) : selectedRoomData?.price);
                  
                  let displayPrice: number | string | null | undefined = basePrice;
                  // 如果有動態價格，使用動態價格
                  if (record?.weekdayPrice && !isWeekend) {
                    displayPrice = typeof record.weekdayPrice === 'string' ? parseInt(record.weekdayPrice) : record.weekdayPrice;
                  } else if (record?.weekendPrice && isWeekend) {
                    displayPrice = typeof record.weekendPrice === 'string' ? parseInt(record.weekendPrice) : record.weekendPrice;
                  } else if (record?.weekdayPrice && isWeekend && !record?.weekendPrice) {
                    // 如果只有平日價格但今天是假日，使用平日價格作為備選
                    displayPrice = typeof record.weekdayPrice === 'string' ? parseInt(record.weekdayPrice) : record.weekdayPrice;
                  } else if (record?.weekendPrice && !isWeekend && !record?.weekdayPrice) {
                    // 如果只有假日價格但今天是平日，使用假日價格作為備選
                    displayPrice = typeof record.weekendPrice === 'string' ? parseInt(record.weekendPrice) : record.weekendPrice;
                  }

                  return (
                    <div key={index} className="relative">
                      {!isPast && (
                        <Dialog onOpenChange={(open) => {
                          if (open) {
                            setMaxSalesQuantity(maxQty);
                            setWeekdayPrice(undefined);
                            setWeekendPrice(undefined);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <button
                              onClick={(e) => {
                                if (isSelecting) {
                                  e.preventDefault();
                                  toggleDateSelection(date);
                                }
                              }}
                              className={`w-full aspect-square rounded-lg border ${borderColor} ${bgColor} ${textColor} 
                                flex flex-col items-center justify-center text-sm transition-all
                                cursor-pointer hover:ring-2 hover:ring-gold/50
                                ${isSelected ? "ring-2 ring-gold scale-95" : ""}`}
                            >
                              <span className="font-semibold">{date.getDate()}</span>
                              {displayPrice && <span className="text-xs text-gold mt-0.5">NT${typeof displayPrice === 'number' ? displayPrice.toLocaleString() : displayPrice}</span>}
                              <span className="text-xs text-gray-400 mt-0.5">{bookedQty}/{maxQty}</span>
                              {isBooked && (
                                <span className="text-xs text-red-400 mt-1">已訂</span>
                              )}
                              {isBlocked && !isBooked && (
                                <span className="text-xs text-orange-400 mt-1">關閉</span>
                              )}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/80 border-gold/30 max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-gold">
                                {date.toLocaleDateString('zh-TW')} - 可銷售數量設定
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gold">
                                  最大可銷售數量
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={maxSalesQuantity}
                                    onChange={(e) => setMaxSalesQuantity(parseInt(e.target.value) || 0)}
                                    className="bg-black/60 border-gold/30 text-white flex-1"
                                  />

                                </div>
                              </div>
                              <div className="text-sm text-gray-400">
                                <p>已訂房間數：{bookedQty}</p>
                                <p>剩餘可銷售：{Math.max(0, maxQty - bookedQty)}</p>
                              </div>

                              <div className="border-t border-gold/20 pt-4 mt-4">
                                <h4 className="text-sm font-medium text-gold mb-3">動態房價設定</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">
                                      平日價格 (NT$)
                                    </label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="100"
                                      placeholder="不設定則使用房型基礎價格"
                                      onChange={(e) => setWeekdayPrice(e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="bg-black/60 border-gold/30 text-white text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">
                                      假日價格 (NT$)
                                    </label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="100"
                                      placeholder="不設定則使用房型基礎價格"
                                      onChange={(e) => setWeekendPrice(e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="bg-black/60 border-gold/30 text-white text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-4 border-t border-gold/20">
                                <Button
                                  onClick={() => {
                                    if (weekdayPrice !== undefined || weekendPrice !== undefined) {
                                      updateMaxSalesQuantityMutation.mutate({
                                        roomTypeId: selectedRoomTypeId!,
                                        date: date,
                                        maxSalesQuantity: maxSalesQuantity,
                                      });
                                      updateDynamicPriceMutation.mutate({
                                        roomTypeId: selectedRoomTypeId!,
                                        date: date,
                                        weekdayPrice,
                                        weekendPrice,
                                      });
                                    } else {
                                      updateMaxSalesQuantityMutation.mutate({
                                        roomTypeId: selectedRoomTypeId!,
                                        date: date,
                                        maxSalesQuantity: maxSalesQuantity,
                                      });
                                    }
                                  }}
                                  disabled={updateMaxSalesQuantityMutation.isPending || updateDynamicPriceMutation.isPending}
                                  className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                                >
                                  {updateMaxSalesQuantityMutation.isPending || updateDynamicPriceMutation.isPending ? "保存中..." : "保存設定"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-black/60 border border-gold/30"></div>
                  <span className="text-gray-400">可預訂</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-900/40 border border-orange-500/50"></div>
                  <span className="text-gray-400">管理員關閉</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-900/40 border border-red-500/50"></div>
                  <span className="text-gray-400">已有訂單</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-800/40 border border-gold/30"></div>
                  <span className="text-gray-400">過去日期</span>
                </div>
              </div>

              {/* Action buttons */}
              {selectedDates.size > 0 && (
                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={handleBatchCloseSales}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={batchCloseSalesMutation.isPending}
                    >
                      {batchCloseSalesMutation.isPending ? "處理中..." : `批量關閉銷售 (${selectedDates.size} 個日期)`}
                    </Button>
                    <Button
                      onClick={() => handleSetAvailability(false)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={setAvailabilityMutation.isPending}
                    >
                      關閉預訂 ({selectedDates.size} 個日期)
                    </Button>
                    <Button
                      onClick={() => handleSetAvailability(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={setAvailabilityMutation.isPending}
                    >
                      開放預訂 ({selectedDates.size} 個日期)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDates(new Set())}
                      className="bg-black/60 border-gold/30 text-gold hover:bg-gold/20"
                    >
                      清除選擇
                    </Button>
                  </div>
                  <div className="text-sm text-gray-400 bg-black/40 p-3 rounded">
                    <p>💡 提示：「批量關閉銷售」會將選中日期的最大可銷售數量設為 0，完全停止銷售。</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
