import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

export function ReconciliationReport() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // 設置默認日期範圍（過去 30 天）
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const { data: report, isLoading } = trpc.bookings.reconciliationReport.useQuery(
    {
      startDate,
      endDate,
    },
    {
      enabled: !!startDate && !!endDate,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加載報表中...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-12 text-gray-600">無法加載報表</div>;
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ 待確認',
      confirmed: '✓ 已確認',
      paid_pending: '💳 已匯款',
      paid: '✅ 已付款',
      completed: '🎉 已完成',
      cancelled: '❌ 已取消',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid_pending: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = selectedStatus === 'all' 
    ? report.bookings 
    : report.bookings.filter(b => b.status === selectedStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 每日對帳報表</h1>

        {/* 日期篩選 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                結束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                狀態篩選
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">全部訂房</option>
                <option value="pending">待確認</option>
                <option value="confirmed">已確認</option>
                <option value="paid_pending">已匯款</option>
                <option value="paid">已付款</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">總訂房數</p>
            <p className="text-3xl font-bold text-blue-600">{report.stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-medium">待確認</p>
            <p className="text-3xl font-bold text-yellow-600">{report.stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">已付款金額</p>
            <p className="text-3xl font-bold text-green-600">NT${report.stats.paidAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">未付款金額</p>
            <p className="text-3xl font-bold text-red-600">NT${report.stats.unpaidAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* 詳細統計 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 狀態統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{report.stats.pending}</p>
              <p className="text-sm text-gray-600">待確認</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{report.stats.confirmed}</p>
              <p className="text-sm text-gray-600">已確認</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{report.stats.pending_payment}</p>
              <p className="text-sm text-gray-600">待付款</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{report.stats.paid}</p>
              <p className="text-sm text-gray-600">已付款</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{report.stats.completed}</p>
              <p className="text-sm text-gray-600">已完成</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{report.stats.cancelled}</p>
              <p className="text-sm text-gray-600">已取消</p>
            </div>
          </div>
        </div>

        {/* 訂房列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              訂房詳情 ({filteredBookings.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">訂房編號</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">客戶名稱</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">房型</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">入住日期</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">金額</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      無符合條件的訂房
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.guestName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.roomTypeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.checkInDate).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        NT${parseFloat(booking.totalPrice || '0').toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 金額總結 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">總金額</p>
            <p className="text-3xl font-bold text-gray-900">
              NT${report.stats.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">已收款</p>
            <p className="text-3xl font-bold text-green-600">
              NT${report.stats.paidAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">未收款</p>
            <p className="text-3xl font-bold text-red-600">
              NT${report.stats.unpaidAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
