import React from 'react';
// @ts-nocheck
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AvailabilityCalendar() {
  const { data: roomTypes } = trpc.roomTypes.list.useQuery();
  const utils = trpc.useUtils();

  // 狀態管理
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [priceInput, setPriceInput] = useState("");
  const [dragStart, setDragStart] = useState<string | null>(null);

  // Mutations
  const updatePriceMutation = trpc.roomAvailability.updateDynamicPrice.useMutation({
    onSuccess: () => {
      utils.roomAvailability.getByRoomAndDateRange.invalidate();
      toast.success("價格已更新");
      setSelectedDates(new Set());
      setPriceInput("");
    },
    onError: (error: any) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // 初始化第一個房型
  if (selectedRoomType === "" && roomTypes && roomTypes.length > 0) {
    setSelectedRoomType(roomTypes[0].id.toString());
  }

  // 獲取當前月份的日期
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  // 日期選擇邏輯
  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  // 拖拽範圍選擇
  const handleDateMouseDown = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDragStart(dateStr);
  };

  const handleDateMouseEnter = (day: number) => {
    if (!dragStart) return;

    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const startDate = new Date(dragStart);
    const endDate = new Date(dateStr);

    const newSelected = new Set<string>();
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      newSelected.add(dateKey);
      current.setDate(current.getDate() + 1);
    }

    setSelectedDates(newSelected);
  };

  const handleDateMouseUp = () => {
    setDragStart(null);
  };

  // 批量設置價格
  const handleBatchSetPrice = () => {
    if (selectedDates.size === 0) {
      toast.error("請選擇至少一個日期");
      return;
    }

    if (!priceInput || isNaN(parseFloat(priceInput))) {
      toast.error("請輸入有效的價格");
      return;
    }

    if (!selectedRoomType) {
      toast.error("請選擇房型");
      return;
    }

    const price = parseFloat(priceInput);
    const dateArray = Array.from(selectedDates);

    // 對每個日期進行更新
    dateArray.forEach((dateStr) => {
      const dateObj = new Date(dateStr);
      updatePriceMutation.mutate({
        roomTypeId: parseInt(selectedRoomType),
        date: dateObj,
        weekdayPrice: price,
        weekendPrice: price,
      });
    });
  };

  // 月份導航
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
    setSelectedDates(new Set());
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
    setSelectedDates(new Set());
  };

  const monthName = currentDate.toLocaleDateString("zh-TW", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="space-y-6">
      {/* 房型選擇 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">選擇房型</h2>
        <Select
          value={selectedRoomType}
          onValueChange={(value) => {
            setSelectedRoomType(value);
            setSelectedDates(new Set());
          }}
        >
          <SelectTrigger className="bg-background text-foreground border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roomTypes?.map((type: any) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* 日曆視圖 */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{monthName}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              今天
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* 週日期標題 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期網格 */}
        <div
          className="grid grid-cols-7 gap-2"
          onMouseLeave={handleDateMouseUp}
        >
          {/* 空白天數 */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* 日期 */}
          {days.map((day) => {
            const dateStr = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const isSelected = selectedDates.has(dateStr);
            const isToday =
              new Date().toDateString() ===
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <div
                key={day}
                className={`aspect-square rounded-lg border-2 p-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center text-xs font-medium ${
                  isSelected
                    ? "bg-blue-500 border-blue-600 text-white"
                    : isToday
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
                onClick={() => handleDateClick(day)}
                onMouseDown={() => handleDateMouseDown(day)}
                onMouseEnter={() => handleDateMouseEnter(day)}
                onMouseUp={handleDateMouseUp}
              >
                <div className="font-bold">{day}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>💡 提示：拖拽選擇日期範圍，或點擊單個日期</p>
          <p>已選擇 {selectedDates.size} 個日期</p>
        </div>
      </Card>

      {/* 批量操作區域 */}
      {selectedDates.size > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            批量設置（已選擇 {selectedDates.size} 個日期）
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 設置價格 */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                設置價格（元/晚）
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="輸入價格"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="flex-1 bg-white text-foreground border-blue-300"
                />
                <Button
                  onClick={handleBatchSetPrice}
                  disabled={updatePriceMutation.isPending}
                >
                  {updatePriceMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "設置"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedDates(new Set());
              setPriceInput("");
            }}
            className="w-full"
          >
            清除選擇
          </Button>
        </Card>
      )}

      {/* 圖例 */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-foreground mb-3">圖例</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-yellow-500 bg-yellow-50" />
            <span className="text-muted-foreground">今天</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-blue-600 bg-blue-500" />
            <span className="text-white">已選擇</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-border bg-card" />
            <span className="text-muted-foreground">普通日期</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
