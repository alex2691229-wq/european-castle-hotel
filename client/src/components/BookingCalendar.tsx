import * as React from "react";
import { trpc } from "@/utils/trpc";
import { DayPicker } from "react-day-picker";
import { isSameDay } from "date-fns";

interface BookingCalendarProps {
  roomTypeId: string;
  selectedDate?: Date;
  onSelect: (date: Date | undefined) => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  roomTypeId,
  selectedDate,
  onSelect,
}) => {
  const today = React.useMemo(() => new Date(), []);
  const calendarStart = today;
  const calendarEnd = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  // 核心：只查詢已滿日期
  const { data: fullyBookedDates = [], isLoading } =
    trpc.system.getFullyBookedDates.useQuery(
      {
        roomTypeId,
        startDate: calendarStart,
        endDate: calendarEnd,
      },
      {
        enabled: !!roomTypeId,
      }
    );

  if (isLoading) {
    return <>Loading calendar...</>;
  }

  return (
    <DayPicker
      mode="single"
      selected={selectedDate}
      onSelect={onSelect}
      disabled={(date) =>
        fullyBookedDates.some((d) => isSameDay(d, date))
      }
    />
  );
};

export default BookingCalendar;
