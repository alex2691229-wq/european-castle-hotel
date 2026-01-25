import React from 'react';
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isAfter, isBefore, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  minDate?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  disabled = false,
}: DateRangePickerProps) {
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const checkInRef = useRef<HTMLDivElement>(null);
  const checkOutRef = useRef<HTMLDivElement>(null);

  // 解析日期字符串為 Date 對象
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return parse(dateStr, "yyyy-MM-dd", new Date());
    } catch {
      return undefined;
    }
  };

  // 格式化 Date 對象為字符串
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    try {
      return format(date, "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const checkInDateObj = parseDate(checkInDate);
  const checkOutDateObj = parseDate(checkOutDate);
  const minDateObj = minDate ? parseDate(minDate) : new Date();

  // 處理入住日期選擇
  const handleCheckInSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = formatDate(date);
    onCheckInChange(dateStr);
    setShowCheckInPicker(false);

    // 如果退房日期早於或等於入住日期，自動更新退房日期
    if (checkOutDateObj && !isAfter(checkOutDateObj, date)) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      onCheckOutChange(formatDate(nextDay));
    }
  };

  // 處理退房日期選擇
  const handleCheckOutSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = formatDate(date);
    onCheckOutChange(dateStr);
    setShowCheckOutPicker(false);
  };

  // 點擊外部關閉日期選擇器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        checkInRef.current &&
        !checkInRef.current.contains(event.target as Node)
      ) {
        setShowCheckInPicker(false);
      }
      if (
        checkOutRef.current &&
        !checkOutRef.current.contains(event.target as Node)
      ) {
        setShowCheckOutPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 入住日期 */}
        <div ref={checkInRef} className="relative">
          <label className="text-foreground mb-2 block text-sm font-medium">
            入住日期 <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCheckInPicker(!showCheckInPicker);
                setShowCheckOutPicker(false);
              }}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-left flex items-center justify-between hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {checkInDate
                  ? format(parseDate(checkInDate)!, "yyyy年 MM月 dd日", {
                      locale: zhTW,
                    })
                  : "請選擇入住日期"}
              </span>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </button>

            {showCheckInPicker && (
              <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
                <DayPicker
                  mode="single"
                  selected={checkInDateObj}
                  onSelect={handleCheckInSelect}
                  disabled={(date) => {
                    if (!minDateObj) return false;
                    return isBefore(date, minDateObj) && !isSameDay(date, minDateObj);
                  }}
                  locale={zhTW}
                  className="text-foreground"
                />
              </div>
            )}
          </div>

          {checkInDate && minDateObj && isBefore(parseDate(checkInDate)!, minDateObj) && (
            <p className="text-xs text-red-500 mt-1">入住日期不能早於今天</p>
          )}
        </div>

        {/* 退房日期 */}
        <div ref={checkOutRef} className="relative">
          <label className="text-foreground mb-2 block text-sm font-medium">
            退房日期 <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCheckOutPicker(!showCheckOutPicker);
                setShowCheckInPicker(false);
              }}
              disabled={disabled || !checkInDate}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-left flex items-center justify-between hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {checkOutDate
                  ? format(parseDate(checkOutDate)!, "yyyy年 MM月 dd日", {
                      locale: zhTW,
                    })
                  : "請選擇退房日期"}
              </span>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </button>

            {showCheckOutPicker && checkInDateObj && (
              <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
                <DayPicker
                  mode="single"
                  selected={checkOutDateObj}
                  onSelect={handleCheckOutSelect}
                  disabled={(date) => {
                    // 退房日期必須在入住日期之後
                    return !isAfter(date, checkInDateObj);
                  }}
                  locale={zhTW}
                  className="text-foreground"
                />
              </div>
            )}
          </div>

          {checkOutDate && checkInDate && !isAfter(parseDate(checkOutDate)!, parseDate(checkInDate)!) && (
            <p className="text-xs text-red-500 mt-1">退房日期必須晚於入住日期</p>
          )}
        </div>
      </div>
    </div>
  );
}
