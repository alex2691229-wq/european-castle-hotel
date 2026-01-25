// @ts-nocheck
import { useState, useEffect } from 'react';
import { trpc } from '../../lib/trpc';

interface DashboardStats {
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  monthlyRevenue: number;
  totalRoomTypes: number;
  occupancyRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    monthlyRevenue: 0,
    totalRoomTypes: 0,
    occupancyRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const bookingsQuery = trpc.bookings.list.useQuery();
  const roomTypesQuery = trpc.roomTypes.list.useQuery();

  useEffect(() => {
    if (bookingsQuery.data && roomTypesQuery.data) {
      const bookings = bookingsQuery.data;
      const roomTypes = roomTypesQuery.data;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // 計算今日訂單
      const todayBookings = bookings.filter((b: any) => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      }).length;
      
      // 計算待確認訂單
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
      
      // 計算已確認訂單
      const confirmedBookings = bookings.filter((b: any) => 
        b.status === 'confirmed' || b.status === 'paid' || b.status === 'cash_on_site'
      ).length;
      
      // 計算本月營收（已付款訂單）
      const monthlyRevenue = bookings
        .filter((b: any) => {
          const createdAt = new Date(b.createdAt);
          return createdAt >= startOfMonth && (b.status === 'paid' || b.status === 'completed');
        })
        .reduce((sum: number, b: any) => sum + Number(b.totalPrice || 0), 0);
      
      // 計算房間佔用率（簡化計算）
      const activeBookings = bookings.filter((b: any) => 
        b.status !== 'cancelled' && new Date(b.checkOutDate) >= today
      ).length;
      const totalCapacity = roomTypes.reduce((sum: number, r: any) => sum + (r.maxSalesQuantity || 10), 0) * 30;
      const occupancyRate = totalCapacity > 0 ? Math.round((activeBookings / totalCapacity) * 100) : 0;
      
      setStats({
        todayBookings,
        pendingBookings,
        confirmedBookings,
        monthlyRevenue,
        totalRoomTypes: roomTypes.length,
        occupancyRate: Math.min(occupancyRate, 100),
      });
      
      setIsLoading(false);
    }
  }, [bookingsQuery.data, roomTypesQuery.data]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">儀表板概覽</h2>
      
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 今日入住 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">今日入住</p>
              <p className="text-3xl font-bold mt-2">{stats.todayBookings}</p>
            </div>
            <div className="text-4xl opacity-80">📅</div>
          </div>
        </div>
        
        {/* 待確認訂單 */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">待確認訂單</p>
              <p className="text-3xl font-bold mt-2">{stats.pendingBookings}</p>
            </div>
            <div className="text-4xl opacity-80">⏳</div>
          </div>
        </div>
        
        {/* 已確認訂單 */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">已確認訂單</p>
              <p className="text-3xl font-bold mt-2">{stats.confirmedBookings}</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
        
        {/* 本月營收 */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">本月營收</p>
              <p className="text-3xl font-bold mt-2">NT$ {stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>
      </div>
      
      {/* 第二行統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 房型數量 */}
        <div className="bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">可用房型</p>
              <p className="text-2xl font-bold mt-1 text-white">{stats.totalRoomTypes} 種</p>
            </div>
            <div className="text-3xl">🏨</div>
          </div>
        </div>
        
        {/* 佔用率 */}
        <div className="bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">預估佔用率</p>
              <p className="text-2xl font-bold mt-1 text-white">{stats.occupancyRate}%</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <div className="mt-3 bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.occupancyRate}%` }}
            ></div>
          </div>
        </div>
        
        {/* 快速操作 */}
        <div className="bg-slate-800 rounded-lg shadow p-6">
          <p className="text-slate-400 text-sm mb-3">快速操作</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/admin?tab=bookings'}
              className="w-full text-left px-3 py-2 bg-slate-700 text-blue-400 rounded hover:bg-slate-600 transition"
            >
              📋 查看訂單管理
            </button>
            <button 
              onClick={() => window.location.href = '/admin?tab=rooms'}
              className="w-full text-left px-3 py-2 bg-slate-700 text-green-400 rounded hover:bg-slate-600 transition"
            >
              🛏️ 管理房型
            </button>
          </div>
        </div>
      </div>
      
      {/* 待處理任務 */}
      <div className="bg-slate-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">待處理任務</h3>
        <div className="space-y-3">
          {stats.pendingBookings > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-900/30 rounded-lg">
              <div className="flex items-center">
                <span className="text-orange-400 mr-3">⚠️</span>
                <span className="text-orange-200">有 {stats.pendingBookings} 筆訂單待確認</span>
              </div>
              <button 
                onClick={() => window.location.href = '/admin?tab=bookings'}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium"
              >
                立即處理 →
              </button>
            </div>
          )}
          {stats.todayBookings > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
              <div className="flex items-center">
                <span className="text-blue-400 mr-3">📅</span>
                <span className="text-blue-200">今日有 {stats.todayBookings} 位客人入住</span>
              </div>
              <button 
                onClick={() => window.location.href = '/admin?tab=bookings-list'}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                查看詳情 →
              </button>
            </div>
          )}
          {stats.pendingBookings === 0 && stats.todayBookings === 0 && (
            <div className="text-center text-slate-400 py-4">
              ✨ 目前沒有待處理的任務
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
