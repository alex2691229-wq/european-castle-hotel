import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

export default function DataExport() {
  const [bookingsStartDate, setBookingsStartDate] = useState("");
  const [bookingsEndDate, setBookingsEndDate] = useState("");
  const [bookingsStatus, setBookingsStatus] = useState("");
  
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");

  const exportBookingsMutation = trpc.dataExport.exportBookingsExcel.useMutation({
    onSuccess: (data: any) => {
      // 下載 Excel 文件
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success("訂單數據已導出");
    },
    onError: (error: any) => {
      toast.error(error.message || "導出失敗");
    },
  });

  const exportRevenueMutation = trpc.dataExport.exportRevenueExcel.useMutation({
    onSuccess: (data: any) => {
      // 下載 Excel 文件
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success("營收統計已導出");
    },
    onError: (error: any) => {
      toast.error(error.message || "導出失敗");
    },
  });

  const handleExportBookings = () => {
    exportBookingsMutation.mutate({
      startDate: bookingsStartDate || undefined,
      endDate: bookingsEndDate || undefined,
      status: bookingsStatus || undefined,
    });
  };

  const handleExportRevenue = () => {
    exportRevenueMutation.mutate({
      startDate: revenueStartDate || undefined,
      endDate: revenueEndDate || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">數據導出</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 訂單數據導出 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              訂單數據導出
            </CardTitle>
            <CardDescription>
              導出訂單詳細數據為 Excel 文件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookings-start-date">開始日期（入住日期）</Label>
              <Input
                id="bookings-start-date"
                type="date"
                value={bookingsStartDate}
                onChange={(e) => setBookingsStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookings-end-date">結束日期（入住日期）</Label>
              <Input
                id="bookings-end-date"
                type="date"
                value={bookingsEndDate}
                onChange={(e) => setBookingsEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookings-status">訂單狀態</Label>
              <Select value={bookingsStatus} onValueChange={setBookingsStatus}>
                <SelectTrigger id="bookings-status">
                  <SelectValue placeholder="全部狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部狀態</SelectItem>
                  <SelectItem value="pending">待確認</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                  <SelectItem value="pending_payment">待付款</SelectItem>
                  <SelectItem value="paid">已付款</SelectItem>
                  <SelectItem value="cash_on_site">現場支付</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExportBookings}
              disabled={exportBookingsMutation.isPending}
              className="w-full"
            >
              {exportBookingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  導出中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  導出訂單數據
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 營收統計導出 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              營收統計導出
            </CardTitle>
            <CardDescription>
              導出營收統計數據為 Excel 文件（僅包含已付款訂單）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenue-start-date">開始日期（入住日期）</Label>
              <Input
                id="revenue-start-date"
                type="date"
                value={revenueStartDate}
                onChange={(e) => setRevenueStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue-end-date">結束日期（入住日期）</Label>
              <Input
                id="revenue-end-date"
                type="date"
                value={revenueEndDate}
                onChange={(e) => setRevenueEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                統計內容
              </Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 按房型統計訂單數量</li>
                <li>• 按房型統計總營收</li>
                <li>• 總計統計</li>
              </ul>
            </div>

            <Button
              onClick={handleExportRevenue}
              disabled={exportRevenueMutation.isPending}
              className="w-full"
            >
              {exportRevenueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  導出中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  導出營收統計
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 使用說明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>使用說明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 如果不選擇日期範圍，將導出所有數據</p>
          <p>• 訂單數據包含：訂單編號、客戶信息、房型、日期、金額、狀態等</p>
          <p>• 營收統計僅包含「已付款」狀態的訂單</p>
          <p>• 導出的 Excel 文件可以直接用於財務報表和數據分析</p>
        </CardContent>
      </Card>
    </div>
  );
}
