import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomManagement from "@/pages/admin/RoomManagement";
import BookingManagement from "@/pages/admin/BookingManagement";
import NewsManagement from "@/pages/admin/NewsManagement";
import GalleryManagement from "@/pages/admin/GalleryManagement";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // 檢查是否為管理員
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            存取被拒絕
          </h1>
          <p className="text-muted-foreground mb-6">
            您沒有權限存取管理後台
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">管理後台</h1>
          <p className="text-muted-foreground mt-2">
            歡迎，{user?.name}！管理您的旅館資訊
          </p>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rooms">房型管理</TabsTrigger>
            <TabsTrigger value="bookings">訂單管理</TabsTrigger>
            <TabsTrigger value="news">最新消息</TabsTrigger>
            <TabsTrigger value="gallery">圖片庫</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <RoomManagement />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <NewsManagement />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <GalleryManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
