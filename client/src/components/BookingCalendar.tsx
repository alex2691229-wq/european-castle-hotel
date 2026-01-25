import React from "react";
import { DayPicker } from "react-day-picker";
import { isSameDay } from "date-fns";
import { trpc } from "@/lib/trpc";

interface BookingCalendarProps {
  roomTypeId: number;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
}

export default function BookingCalendar({
  roomTypeId,
  selectedDate,
  onDateSelect,
}: BookingCalendarProps) {
  const today = React.useMemo(() => new Date(), []);
  const calendarEnd = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  // 簡化：暫時不查詢已滿日期，允許所有日期可選
  // TODO: 實現 system.getFullyBookedDates 端點
  const fullyBookedDates: Date[] = [];

  return (
    <div className="w-full">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={(date) => {
          // 禁用過去的日期
          if (date < today) return true;
          // 禁用超過 3 個月的日期
          if (date > calendarEnd) return true;
          // 禁用已滿的日期
          return fullyBookedDates.some((d) => isSameDay(d, date));
        }}
        className="w-full"
      />
    </div>
  );
}
