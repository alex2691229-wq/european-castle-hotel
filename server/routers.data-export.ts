import { router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { bookings, roomTypes } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import ExcelJS from "exceljs";

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

      // 構建 WHERE 子句
      const whereConditions: string[] = [];
      if (startDate) whereConditions.push(`checkInDate >= '${startDate}'`);
      if (endDate) whereConditions.push(`checkInDate <= '${endDate}'`);
      if (status) whereConditions.push(`status = '${status}'`);
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // 查詢訂單數據
      const result = await db.execute(sql.raw(`
        SELECT 
          b.id,
          b.guestName,
          b.guestEmail,
          b.guestPhone,
          b.roomTypeId,
          b.checkInDate,
          b.checkOutDate,
          b.numberOfGuests,
          b.totalPrice,
          b.status,
          b.createdAt,
          rt.name as roomTypeName
        FROM bookings b
        LEFT JOIN roomTypes rt ON b.roomTypeId = rt.id
        ${whereClause}
        ORDER BY b.createdAt DESC
      `));

      const bookingData = (result as any).rows || result as any[];

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

      // 添加數據行
      bookingData.forEach((booking: any) => {
        worksheet.addRow({
          id: booking.id,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
          guestEmail: booking.guestEmail,
          roomTypeName: booking.roomTypeName || "未知",
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          numberOfGuests: booking.numberOfGuests,
          totalPrice: booking.totalPrice,
          status: booking.status,
          createdAt: new Date(booking.createdAt).toLocaleString("zh-TW"),
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
      const { startDate, endDate } = input;
      const db = await getDb();
      if (!db) throw new Error('數據庫連接失敗');

      // 構建 WHERE 子句
      const whereConditions: string[] = ["status = '已付款'"];
      if (startDate) whereConditions.push(`checkInDate >= '${startDate}'`);
      if (endDate) whereConditions.push(`checkInDate <= '${endDate}'`);
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // 查詢營收數據（按房型統計）
      const result = await db.execute(sql.raw(`
        SELECT 
          rt.name as roomTypeName,
          COUNT(*) as bookingCount,
          SUM(b.totalPrice) as totalRevenue
        FROM bookings b
        LEFT JOIN roomTypes rt ON b.roomTypeId = rt.id
        ${whereClause}
        GROUP BY b.roomTypeId, rt.name
      `));

      const revenueData = (result as any).rows || result as any[];

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

      revenueData.forEach((item: any) => {
        const revenue = Number(item.totalRevenue) || 0;
        const count = Number(item.bookingCount) || 0;
        
        worksheet.addRow({
          roomTypeName: item.roomTypeName || "未知",
          bookingCount: count,
          totalRevenue: revenue,
        });

        totalBookings += count;
        totalRevenue += revenue;
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
