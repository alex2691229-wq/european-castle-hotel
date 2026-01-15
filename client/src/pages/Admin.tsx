import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomManagement from "@/pages/admin/RoomManagement";
import BookingManagementOptimized from "@/pages/admin/BookingManagementOptimized";
import BookingListView from "@/pages/admin/BookingListView";
import NewsManagement from "@/pages/admin/NewsManagement";
import RoomBatchUpdate from "@/pages/admin/RoomBatchUpdate";
import RoomBulkEdit from "@/pages/admin/RoomBulkEdit";
import DataExport from "@/pages/admin/DataExport";
import HomeManagement from "@/pages/admin/HomeManagement";
import AvailabilityManagement from "@/pages/admin/AvailabilityManagement";
import AvailabilityCalendar from "@/pages/admin/AvailabilityCalendar";
import AccountManagement from "@/pages/admin/AccountManagement";
import Dashboard from "@/pages/admin/Dashboard";

export default function Admin() {
  // 權限驗證已移除 - 所有人都可以訪問後台
  const user = { name: '管理員' }; // 模擬用戶
  const [activeCategory, setActiveCategory] = useState("dashboard");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">管理後台</h1>
          <p className="text-muted-foreground mt-2">
            歡迎！管理您的旅館資訊
          </p>
        </div>

        {/* 主分類選項卡 */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              📊 儀表板
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              📋 訂單管理
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              🏨 房型管理
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              📝 內容管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              ⚙️ 系統設置
            </TabsTrigger>
          </TabsList>

          {/* 儀表板 */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="bg-slate-900 rounded-lg shadow p-6">
              <Dashboard />
            </div>
          </TabsContent>

          {/* 訂單管理分類 */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="bg-slate-900 rounded-lg shadow">
              <Tabs defaultValue="booking-management" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="booking-management" className="rounded-none">
                    訂單管理
                  </TabsTrigger>
                  <TabsTrigger value="booking-list" className="rounded-none">
                    訂單列表
                  </TabsTrigger>
                  <TabsTrigger value="data-export" className="rounded-none">
                    數據導出
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="booking-management" className="space-y-4 mt-0">
                    <BookingManagementOptimized />
                  </TabsContent>

                  <TabsContent value="booking-list" className="space-y-4 mt-0">
                    <BookingListView />
                  </TabsContent>

                  <TabsContent value="data-export" className="space-y-4 mt-0">
                    <DataExport />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </TabsContent>

          {/* 房型管理分類 */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="bg-slate-900 rounded-lg shadow">
              <Tabs defaultValue="room-management" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="room-management" className="rounded-none">
                    房型列表
                  </TabsTrigger>
                  <TabsTrigger value="batch-update" className="rounded-none">
                    批量更新
                  </TabsTrigger>
                  <TabsTrigger value="calendar-management" className="rounded-none">
                    可銷售房間管理
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="room-management" className="space-y-4 mt-0">
                    <RoomManagement />
                  </TabsContent>

                  <TabsContent value="batch-update" className="space-y-4 mt-0">
                    <RoomBatchUpdate />
                  </TabsContent>

                  <TabsContent value="calendar-management" className="space-y-4 mt-0">
                    <AvailabilityManagement />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </TabsContent>

          {/* 內容管理分類 */}
          <TabsContent value="content" className="space-y-4">
            <div className="bg-slate-900 rounded-lg shadow">
              <Tabs defaultValue="news" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                  <TabsTrigger value="news" className="rounded-none">
                    最新消息
                  </TabsTrigger>
                  <TabsTrigger value="home" className="rounded-none">
                    首頁管理
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="news" className="space-y-4 mt-0">
                    <NewsManagement />
                  </TabsContent>

                  <TabsContent value="home" className="space-y-4 mt-0">
                    <HomeManagement />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </TabsContent>

          {/* 系統設置分類 */}
          <TabsContent value="settings" className="space-y-4">
            <div className="bg-slate-900 rounded-lg shadow">
              <Tabs defaultValue="accounts" className="w-full">
                <TabsList className="grid w-full grid-cols-1 rounded-none border-b">
                  <TabsTrigger value="accounts" className="rounded-none">
                    账户管理
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="accounts" className="space-y-4 mt-0">
                    <AccountManagement />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
