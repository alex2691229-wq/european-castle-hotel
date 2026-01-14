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
  // 權限驗證已移除 - 所有人都可以訪問後台
  const user = { name: '管理員' }; // 模擬用戶

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">管理後台</h1>
          <p className="text-muted-foreground mt-2">
            歡迎！管理您的旅館資訊
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
