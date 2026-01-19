import { router, protectedProcedure } from './_core/trpc.js';
// @ts-nocheck
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from './db.js';
import { bookings, roomTypes } from '../drizzle/schema.js';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const dataExportRouter = router({
  /**
   * 導出訂單數據為 Excel
   */
  exportBookingsExcel: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { startDate, endDate, status } = input;
      const db = await getDb();
      if (!db) throw new Error('數據庫連接失敗');

      // 使用 Drizzle ORM 查詢
      let query = db.select({
        id: bookings.id,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        guestPhone: bookings.guestPhone,
        roomTypeId: bookings.roomTypeId,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        numberOfGuests: bookings.numberOfGuests,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        createdAt: bookings.createdAt,
        roomTypeName: roomTypes.name,
      })
      .from(bookings)
      .leftJoin(roomTypes, eq(bookings.roomTypeId, roomTypes.id))
      .orderBy(desc(bookings.createdAt));

      const bookingData = await query;

      // 創建 Excel 工作簿
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("訂單數據");

      // 設置列標題
      worksheet.columns = [
        { header: "訂單編號", key: "id", width: 12 },
        { header: "客戶姓名", key: "guestName", width: 15 },
        { header: "電話", key: "guestPhone", width: 15 },
        { header: "電子郵件", key: "guestEmail", width: 25 },
        { header: "房型", key: "roomTypeName", width: 20 },
        { header: "入住日期", key: "checkInDate", width: 12 },
        { header: "退房日期", key: "checkOutDate", width: 12 },
        { header: "人數", key: "numberOfGuests", width: 8 },
        { header: "總金額", key: "totalPrice", width: 12 },
        { header: "狀態", key: "status", width: 12 },
        { header: "創建時間", key: "createdAt", width: 18 },
      ];

      // 設置標題行樣式
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };

      // 狀態翻譯
      const statusMap: Record<string, string> = {
        pending: "待確認",
        confirmed: "已確認",
        pending_payment: "待付款",
        paid: "已付款",
        cash_on_site: "現場付款",
        completed: "已完成",
        cancelled: "已取消",
      };

      // 添加數據行
      bookingData.forEach((booking: any) => {
        worksheet.addRow({
          id: booking.id,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
          guestEmail: booking.guestEmail || "",
          roomTypeName: booking.roomTypeName || "未知",
          checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("zh-TW") : "",
          checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("zh-TW") : "",
          numberOfGuests: booking.numberOfGuests,
          totalPrice: booking.totalPrice,
          status: statusMap[booking.status] || booking.status,
          createdAt: booking.createdAt ? new Date(booking.createdAt).toLocaleString("zh-TW") : "",
        });
      });

      // 生成 Excel 文件
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      return {
        success: true,
        data: base64,
        filename: `訂單數據_${new Date().toISOString().split("T")[0]}.xlsx`,
      };
    }),

  /**
   * 導出營收統計數據為 Excel
   */
  exportRevenueExcel: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('數據庫連接失敗');

      // 使用 Drizzle ORM 查詢已付款的訂單
      const allBookings = await db.select({
        roomTypeId: bookings.roomTypeId,
        totalPrice: bookings.totalPrice,
        roomTypeName: roomTypes.name,
      })
      .from(bookings)
      .leftJoin(roomTypes, eq(bookings.roomTypeId, roomTypes.id))
      .where(eq(bookings.status, 'paid'));

      // 按房型統計
      const revenueByRoomType: Record<string, { count: number; revenue: number; name: string }> = {};
      
      allBookings.forEach((booking: any) => {
        const roomTypeId = booking.roomTypeId?.toString() || 'unknown';
        if (!revenueByRoomType[roomTypeId]) {
          revenueByRoomType[roomTypeId] = {
            count: 0,
            revenue: 0,
            name: booking.roomTypeName || '未知',
          };
        }
        revenueByRoomType[roomTypeId].count++;
        revenueByRoomType[roomTypeId].revenue += Number(booking.totalPrice) || 0;
      });

      // 創建 Excel 工作簿
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("營收統計");

      // 設置列標題
      worksheet.columns = [
        { header: "房型", key: "roomTypeName", width: 20 },
        { header: "訂單數量", key: "bookingCount", width: 12 },
        { header: "總營收", key: "totalRevenue", width: 15 },
      ];

      // 設置標題行樣式
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };

      // 添加數據行
      let totalBookings = 0;
      let totalRevenue = 0;

      Object.values(revenueByRoomType).forEach((item) => {
        worksheet.addRow({
          roomTypeName: item.name,
          bookingCount: item.count,
          totalRevenue: item.revenue,
        });

        totalBookings += item.count;
        totalRevenue += item.revenue;
      });

      // 添加總計行
      worksheet.addRow({
        roomTypeName: "總計",
        bookingCount: totalBookings,
        totalRevenue: totalRevenue,
      });

      // 設置總計行樣式
      const lastRow = worksheet.lastRow;
      if (lastRow) {
        lastRow.font = { bold: true };
        lastRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEB3B" },
        };
      }

      // 生成 Excel 文件
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      return {
        success: true,
        data: base64,
        filename: `營收統計_${new Date().toISOString().split("T")[0]}.xlsx`,
      };
    }),
});
