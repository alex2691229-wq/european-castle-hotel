import React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/DateRangePicker";

export default function Booking() {
  const [, navigate] = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");
  const [minDate, setMinDate] = useState("");

  const { data: roomTypes } = trpc.roomTypes.list.useQuery();
  const createBookingMutation = trpc.bookings.create.useMutation();
  
  // 查詢房間庫存
  const { data: availability } = trpc.roomAvailability.checkAvailability.useQuery(
    {
      roomTypeId: parseInt(selectedRoomId),
      checkInDate: checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    },
    {
      enabled: !!selectedRoomId && !!checkInDate && !!checkOutDate,
    }
  );

  // Get roomId from URL query if available and set min date
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    if (roomId) {
      setSelectedRoomId(roomId);
    }
    
    // Set minimum date to today (using local date)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  const selectedRoom = roomTypes?.find(
    (room) => room.id === parseInt(selectedRoomId)
  ) || null;

  const calculateTotalPrice = () => {
    if (!selectedRoom || !checkInDate || !checkOutDate) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) return 0;

    // 計算平日和假日價格
    let total = 0;
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn);
      currentDate.setDate(currentDate.getDate() + i);
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 週末：星期日或星期六
      
      const price = isWeekend && selectedRoom.weekendPrice 
        ? Number(selectedRoom.weekendPrice) 
        : Number(selectedRoom.price);
      total += price;
    }

    return total;
  };
  
  // 獲取庫存狀態顯示
  const getAvailabilityBadge = () => {
    if (!availability) return null;
    
    const available = availability.available;
    if (available >= 3) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ 有房（還有 {available} 間）
        </span>
      );
    } else if (available > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⚠️ 僅剩 {available} 間
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✖ 已滿房
        </span>
      );
    }
  };

  // 計算住宿夜數
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證所有必填欄位
    if (!selectedRoomId) {
      toast.error("請選擇房型");
      return;
    }

    if (!checkInDate) {
      toast.error("請填寫入住日期");
      return;
    }

    if (!checkOutDate) {
      toast.error("請填寫退房日期");
      return;
    }

    if (!guestName) {
      toast.error("請填寫姓名");
      return;
    }

    if (!guestPhone) {
      toast.error("請填寫電話號碼");
      return;
    }

    // 驗證日期邏輯
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      toast.error("退房日期必須晚於入住日期");
      return;
    }

    try {
      // 確保日期格式正確（YYYY-MM-DD）
      const checkInStr = checkInDate.includes('-') ? checkInDate : new Date(checkInDate).toISOString().split('T')[0];
      const checkOutStr = checkOutDate.includes('-') ? checkOutDate : new Date(checkOutDate).toISOString().split('T')[0];

      // 計算住宿晚數
      const checkIn = new Date(checkInStr);
      const checkOut = new Date(checkOutStr);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      await createBookingMutation.mutateAsync({
        roomTypeId: parseInt(selectedRoomId),
        guestName,
        guestEmail: guestEmail || undefined,
        guestPhone,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        numberOfGuests: parseInt(numberOfGuests),
        totalPrice: calculateTotalPrice().toString(),
        specialRequests: specialRequests || undefined,
      });

      // 儲存訂單數據到 sessionStorage
      const bookingConfirmationData = {
        roomName: selectedRoom?.name,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        guestName,
        guestEmail,
        guestPhone,
        numberOfGuests: parseInt(numberOfGuests),
        totalPrice: calculateTotalPrice(),
        nights,
        specialRequests,
      };
      sessionStorage.setItem("bookingConfirmation", JSON.stringify(bookingConfirmationData));
      
      // 導航到確認頁面
      navigate("/booking/confirmation");
    } catch (error: any) {
      toast.error(error.message || "訂房失敗，請稍後再試");
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23fff%22 width=%221%22 height=%221%22/></svg>')] bg-repeat"></div>
        </div>
        <div className="relative text-center text-white">
          <h1 className="text-5xl font-bold mb-4 art-deco-border pb-4">立即訂房</h1>
          <p className="text-xl text-amber-100">選擇您喜愛的房型，享受舒適的住宿體驗</p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-border shadow-luxury">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6 art-deco-border pb-6">
                      預訂資訊
                    </h2>

                    {/* Room Selection */}
                    <div className="mb-6">
                      <Label htmlFor="room" className="text-foreground mb-2 block">
                        選擇房型 <span className="text-destructive">*</span>
                      </Label>
                      <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="請選擇房型">
                            {selectedRoom ? `${selectedRoom.name} - NT$ ${Math.floor(Number(selectedRoom.price)).toLocaleString()}` : "請選擇房型"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes?.map((room) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {room.name} - NT$ {Math.floor(Number(room.price)).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dates */}
                    <DateRangePicker
                      checkInDate={checkInDate}
                      checkOutDate={checkOutDate}
                      onCheckInChange={setCheckInDate}
                      onCheckOutChange={setCheckOutDate}
                      minDate={minDate}
                    />

                    {/* Guest Information */}
                    <div className="mb-6">
                      <Label htmlFor="name" className="text-foreground mb-2 block">
                        姓名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="請輸入您的姓名"
                        className="bg-background border-border text-foreground"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label htmlFor="email" className="text-foreground mb-2 block">
                          電子郵件
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="請輸入您的電子郵件"
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-foreground mb-2 block">
                          電話號碼 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="請輸入您的電話號碼"
                          className="bg-background border-border text-foreground"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label htmlFor="guests" className="text-foreground mb-2 block">
                        入住人數
                      </Label>
                      <Select value={numberOfGuests} onValueChange={setNumberOfGuests}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue>{numberOfGuests} 人</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} 人
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mb-6">
                      <Label htmlFor="requests" className="text-foreground mb-2 block">
                        特殊需求
                      </Label>
                      <Textarea
                        id="requests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="請告訴我們您的特殊需求（可選）"
                        className="bg-background border-border text-foreground min-h-24"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? "處理中..." : "確認訂房"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary */}
              <div>
                <Card className="bg-card border-border shadow-luxury sticky top-20">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4 art-deco-border pb-4">
                      訂單摘要
                    </h3>

                    {selectedRoom ? (
                      <>
                        <div className="space-y-3 mb-6 pb-6 border-b border-border">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">房型：</span>
                            <span className="font-medium">{selectedRoom.name}</span>
                          </div>
                          {checkInDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">入住：</span>
                              <span className="font-medium">{new Date(checkInDate).toLocaleDateString('zh-TW')}</span>
                            </div>
                          )}
                          {checkOutDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">退房：</span>
                              <span className="font-medium">{new Date(checkOutDate).toLocaleDateString('zh-TW')}</span>
                            </div>
                          )}
                          {nights > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">住宿夜數：</span>
                              <span className="font-medium">{nights} 晚</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">房價：</span>
                            <span className="font-medium">NT$ {Math.floor(Number(selectedRoom.price)).toLocaleString()}/晚</span>
                          </div>
                        </div>

                        {availability && (
                          <div className="mb-6">
                            {getAvailabilityBadge()}
                          </div>
                        )}

                        {nights > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between font-semibold text-lg">
                              <span>總價：</span>
                              <span className="text-amber-600">NT$ {Math.floor(calculateTotalPrice()).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              包含 {nights} 晚住宿費用
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">請選擇房型以查看價格</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
