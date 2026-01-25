import React from 'react';
import { useState } from 'react';

export default function DataExport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBookings = async () => {
    try {
      setIsExporting(true);
      
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status !== 'all') params.status = status;
      
      // 使用 fetch 直接調用 API
      const response = await fetch('/api/trpc/dataExport.exportBookingsExcel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const result = await response.json();
      
      if (result.result?.data?.success && result.result?.data?.data) {
        const base64Data = result.result.data.data;
        const filename = result.result.data.filename;
        
        // 將 base64 轉換為 Blob 並下載
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('導出成功！');
      } else {
        throw new Error('導出失敗');
      }
    } catch (error) {
      console.error('導出失敗:', error);
      alert('導出失敗，請確認您已登入管理員帳號');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRevenue = async () => {
    try {
      setIsExporting(true);
      
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await fetch('/api/trpc/dataExport.exportRevenueExcel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const result = await response.json();
      
      if (result.result?.data?.success && result.result?.data?.data) {
        const base64Data = result.result.data.data;
        const filename = result.result.data.filename;
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('導出成功！');
      } else {
        throw new Error('導出失敗');
      }
    } catch (error) {
      console.error('導出失敗:', error);
      alert('導出失敗，請確認您已登入管理員帳號');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">數據導出</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 訂單數據導出 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">導出訂單數據</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">開始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">結束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">訂單狀態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">全部</option>
                <option value="pending">待確認</option>
                <option value="confirmed">已確認</option>
                <option value="paid">已付款</option>
                <option value="checked_in">已入住</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            
            <button
              onClick={handleExportBookings}
              disabled={isExporting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExporting ? '導出中...' : '導出訂單 Excel'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            <p>• 導出的 Excel 文件包含訂單編號、客戶信息、房型、日期、金額等詳細信息</p>
            <p>• 如果不選擇日期範圍，將導出所有訂單</p>
          </div>
        </div>

        {/* 營收統計導出 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">導出營收統計</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">開始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">結束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="h-[52px]"></div>
            
            <button
              onClick={handleExportRevenue}
              disabled={isExporting}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExporting ? '導出中...' : '導出營收統計 Excel'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            <p>• 導出按房型統計的營收數據</p>
            <p>• 僅統計已付款的訂單</p>
            <p>• 包含訂單數量和總營收</p>
          </div>
        </div>
      </div>
    </div>
  );
}
