import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BookingCalendarProps {
  roomTypeId: number;
  onDateSelect?: (date: Date) => void;
}

export default function BookingCalendar({ roomTypeId, onDateSelect }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 查詢該房型的訂房記錄
const { data: bookings } = trpc.bookings.list.useQuery({ roomTypeId });  
  // 獲取當前月份的天數
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  // 檢查日期是否已被預訂
  const isDateBooked = (date: Date) => {
    if (!bookings) return false;
    
    return bookings.some((booking) => {
      if (booking.roomTypeId !== roomTypeId) return false;
      if (booking.status === "cancelled") return false;
      
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const checkDate = new Date(date);
      
      return checkDate >= checkIn && checkDate < checkOut;
    });
  };
  
  // 檢查日期是否在過去
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // 切換到上個月
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // 切換到下個月
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  
  // 生成日曆格子
  const calendarDays = [];
  
  // 添加空白格子（月初之前的日期）
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-12" />);
  }
  
  // 添加當月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const booked = isDateBooked(date);
    const past = isPastDate(date);
    const available = !booked && !past;
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => available && onDateSelect?.(date)}
        disabled={!available}
        className={`
          h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all
          ${available ? "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer" : ""}
          ${booked ? "bg-destructive/20 text-destructive cursor-not-allowed" : ""}
          ${past ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
        `}
      >
        {day}
      </button>
    );
  }
  
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* 月份導航 */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="h-10 w-10 border-2 border-primary/50 hover:bg-primary hover:text-primary-foreground transition-colors"
            title="上個月"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h3 className="text-xl font-bold text-foreground">
            {year} 年 {monthNames[month]}
          </h3>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="h-10 w-10 border-2 border-primary/50 hover:bg-primary hover:text-primary-foreground transition-colors"
            title="下個月"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 星期標題 */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* 日曆格子 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays}
        </div>
        
        {/* 圖例 */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/10 border border-primary" />
            <span className="text-muted-foreground">可預訂</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive" />
            <span className="text-muted-foreground">已預訂</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted border border-muted-foreground/20" />
            <span className="text-muted-foreground">過去日期</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
