import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function AvailabilityManagement() {
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  // Fetch room types
  const { data: roomTypes = [] } = trpc.roomTypes.list.useQuery();

  // Calculate date range for current month
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Fetch unavailable dates for selected room
  const { data: unavailableDates = [], refetch: refetchUnavailable } = trpc.roomAvailability.getUnavailableDates.useQuery(
    {
      roomTypeId: selectedRoomTypeId!,
      startDate: startOfMonth,
      endDate: endOfMonth,
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

  // Check if a date is unavailable (booked or blocked by admin)
  const isDateUnavailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return unavailableDates.some(d => new Date(d).toISOString().split('T')[0] === dateStr);
  };

  // Check if a date is blocked by admin (not booked)
  const isDateBlockedByAdmin = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilityRecords.some(
      record => new Date(record.date).toISOString().split('T')[0] === dateStr && !record.isAvailable
    );
  };

  // Check if a date is booked
  const isDateBooked = (date: Date) => {
    return isDateUnavailable(date) && !isDateBlockedByAdmin(date);
  };

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.has(dateStr);
  };

  // Toggle date selection
  const toggleDateSelection = (date: Date) => {
    // Don't allow selecting booked dates
    if (isDateBooked(date)) {
      toast.error("此日期已有確認訂單，無法修改");
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const newSelected = new Set(selectedDates);
    
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    
    setSelectedDates(newSelected);
  };

  // Handle batch availability update
  const handleSetAvailability = (isAvailable: boolean) => {
    if (selectedDates.size === 0) {
      toast.error("請先選擇要設定的日期");
      return;
    }

    if (!selectedRoomTypeId) return;

    const dates = Array.from(selectedDates).map(dateStr => new Date(dateStr));
    
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
                <CardTitle className="text-gold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                </CardTitle>
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
              <CardDescription className="text-gray-400">
                點擊日期選擇，然後使用下方按鈕批量設定可用性
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

                  return (
                    <button
                      key={index}
                      onClick={() => !isPast && toggleDateSelection(date)}
                      disabled={isPast}
                      className={`aspect-square rounded-lg border ${borderColor} ${bgColor} ${textColor} 
                        flex flex-col items-center justify-center text-sm transition-all
                        ${!isPast && !isBooked ? "cursor-pointer" : "cursor-not-allowed"}
                        ${isSelected ? "scale-95" : ""}`}
                    >
                      <span className="font-semibold">{date.getDate()}</span>
                      {isBooked && (
                        <span className="text-xs text-red-400 mt-1">已訂</span>
                      )}
                      {isBlocked && !isBooked && (
                        <span className="text-xs text-orange-400 mt-1">關閉</span>
                      )}
                    </button>
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
                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={() => handleSetAvailability(false)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={setAvailabilityMutation.isPending}
                  >
                    關閉預訂 ({selectedDates.size} 個日期)
                  </Button>
                  <Button
                    onClick={() => handleSetAvailability(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
