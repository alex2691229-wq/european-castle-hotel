import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomManagement from "@/pages/admin/RoomManagement";
import BookingManagement from "@/pages/admin/BookingManagement";
import NewsManagement from "@/pages/admin/NewsManagement";

import RoomBatchUpdate from "@/pages/admin/RoomBatchUpdate";
import HomeManagement from "@/pages/admin/HomeManagement";
import AvailabilityManagement from "@/pages/admin/AvailabilityManagement";
import AccountManagement from "@/pages/admin/AccountManagement";


export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // 檢查是否已登入
  useEffect(() => {
    if (!isAuthenticated) {
      // 未登入，重定向到登入頁面
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

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
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            去登入
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="rooms">房型管理</TabsTrigger>
            <TabsTrigger value="batch-update">批量更新</TabsTrigger>
            <TabsTrigger value="bookings">訂單管理</TabsTrigger>
            <TabsTrigger value="news">最新消息</TabsTrigger>
            <TabsTrigger value="home">首頁管理</TabsTrigger>
            <TabsTrigger value="availability">可用性管理</TabsTrigger>
            <TabsTrigger value="accounts">帳戶管理</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <RoomManagement />
          </TabsContent>

          <TabsContent value="batch-update" className="space-y-4">
            <RoomBatchUpdate />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <NewsManagement />
          </TabsContent>

          <TabsContent value="home" className="space-y-4">
            <HomeManagement />
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <AvailabilityManagement />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <AccountManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
