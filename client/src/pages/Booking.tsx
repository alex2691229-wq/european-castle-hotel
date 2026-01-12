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
import { Calendar } from "lucide-react";

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

  const { data: roomTypes } = trpc.roomTypes.list.useQuery();
  const createBookingMutation = trpc.bookings.create.useMutation();

  // Get roomId from URL query if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    if (roomId) {
      setSelectedRoomId(roomId);
    }
  }, []);

  const selectedRoom = roomTypes?.find(
    (room) => room.id === parseInt(selectedRoomId)
  );

  const calculateTotalPrice = () => {
    if (!selectedRoom || !checkInDate || !checkOutDate) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) return 0;

    // Simple calculation - use weekday price for now
    return Number(selectedRoom.price) * nights;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoomId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      toast.error("退房日期必須晚於入住日期");
      return;
    }

    try {
      await createBookingMutation.mutateAsync({
        roomTypeId: parseInt(selectedRoomId),
        guestName,
        guestEmail: guestEmail || undefined,
        guestPhone,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: parseInt(numberOfGuests),
        totalPrice: calculateTotalPrice().toString(),
        specialRequests: specialRequests || undefined,
      });

      toast.success("訂房申請已送出！我們將盡快與您聯繫確認。");
      
      // Reset form
      setSelectedRoomId("");
      setCheckInDate("");
      setCheckOutDate("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setNumberOfGuests("2");
      setSpecialRequests("");
      
      // Navigate to home after 2 seconds
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      toast.error(error.message || "訂房失敗，請稍後再試");
    }
  };

  const totalPrice = calculateTotalPrice();
  const nights =
    checkInDate && checkOutDate
      ? Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative h-64 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/pFBLqdisXmBi.jpg"
            alt="Booking"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl font-bold text-foreground mb-4 text-gold-gradient">
              線上訂房
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              ONLINE BOOKING
            </p>
          </div>
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
                          <SelectValue placeholder="請選擇房型" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label htmlFor="checkIn" className="text-foreground mb-2 block">
                          入住日期 <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="checkIn"
                            type="date"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="bg-background border-border"
                            required
                          />
                          <Calendar className="absolute right-3 top-3 text-muted-foreground pointer-events-none" size={18} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="checkOut" className="text-foreground mb-2 block">
                          退房日期 <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="checkOut"
                            type="date"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            min={checkInDate || new Date().toISOString().split("T")[0]}
                            className="bg-background border-border"
                            required
                          />
                          <Calendar className="absolute right-3 top-3 text-muted-foreground pointer-events-none" size={18} />
                        </div>
                      </div>
                    </div>

                    {/* Number of Guests */}
                    <div className="mb-6">
                      <Label htmlFor="guests" className="text-foreground mb-2 block">
                        入住人數 <span className="text-destructive">*</span>
                      </Label>
                      <Select value={numberOfGuests} onValueChange={setNumberOfGuests}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 人</SelectItem>
                          <SelectItem value="2">2 人</SelectItem>
                          <SelectItem value="3">3 人</SelectItem>
                          <SelectItem value="4">4 人</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />

                    <h2 className="text-2xl font-bold text-foreground mb-6">
                      聯絡資訊
                    </h2>

                    {/* Guest Info */}
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name" className="text-foreground mb-2 block">
                          姓名 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="請輸入您的姓名"
                          className="bg-background border-border"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-foreground mb-2 block">
                          電話 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="請輸入您的電話號碼"
                          className="bg-background border-border"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-foreground mb-2 block">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="請輸入您的 Email"
                          className="bg-background border-border"
                        />
                      </div>

                      <div>
                        <Label htmlFor="requests" className="text-foreground mb-2 block">
                          特殊需求
                        </Label>
                        <Textarea
                          id="requests"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="如有特殊需求，請在此說明"
                          className="bg-background border-border min-h-[120px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-card border-border shadow-luxury sticky top-24">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-6">
                      訂單摘要
                    </h3>

                    {selectedRoom ? (
                      <div className="space-y-4">
                        <div className="pb-4 border-b border-border">
                          <p className="text-sm text-muted-foreground mb-1">房型</p>
                          <p className="text-lg font-semibold text-foreground">
                            {selectedRoom.name}
                          </p>
                        </div>

                        {checkInDate && checkOutDate && nights > 0 && (
                          <>
                            <div className="pb-4 border-b border-border">
                              <p className="text-sm text-muted-foreground mb-1">入住日期</p>
                              <p className="text-foreground">
                                {new Date(checkInDate).toLocaleDateString("zh-TW")}
                              </p>
                            </div>

                            <div className="pb-4 border-b border-border">
                              <p className="text-sm text-muted-foreground mb-1">退房日期</p>
                              <p className="text-foreground">
                                {new Date(checkOutDate).toLocaleDateString("zh-TW")}
                              </p>
                            </div>

                            <div className="pb-4 border-b border-border">
                              <p className="text-sm text-muted-foreground mb-1">住宿天數</p>
                              <p className="text-foreground">{nights} 晚</p>
                            </div>

                            <div className="pt-4">
                              <p className="text-sm text-muted-foreground mb-2">總金額</p>
                              <p className="text-3xl font-bold text-primary">
                                NT$ {totalPrice.toLocaleString()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        請選擇房型以查看價格
                      </p>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? "處理中..." : "確認訂房"}
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      送出訂單後，我們將盡快與您聯繫確認訂房詳情
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
