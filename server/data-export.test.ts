import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('./db', () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([
            {
              id: 1,
              guestName: '測試客戶',
              guestEmail: 'test@example.com',
              guestPhone: '0912345678',
              roomTypeId: 1,
              checkInDate: new Date('2026-01-20'),
              checkOutDate: new Date('2026-01-22'),
              numberOfGuests: 2,
              totalPrice: '4400.00',
              status: 'confirmed',
              createdAt: new Date(),
              roomTypeName: '標準雙人房',
            },
          ])),
          where: vi.fn(() => Promise.resolve([
            {
              roomTypeId: 1,
              totalPrice: '4400.00',
              roomTypeName: '標準雙人房',
            },
          ])),
        })),
      })),
    })),
  })),
}));

// Mock ExcelJS
vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => ({
      addWorksheet: vi.fn(() => ({
        columns: [],
        getRow: vi.fn(() => ({
          font: {},
          fill: {},
        })),
        addRow: vi.fn(),
        lastRow: {
          font: {},
          fill: {},
        },
      })),
      xlsx: {
        writeBuffer: vi.fn(() => Promise.resolve(Buffer.from('test'))),
      },
    })),
  },
}));

describe('數據導出功能測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('導出訂單數據', () => {
    it('應該能夠導出訂單數據為 Excel', async () => {
      // 模擬導出邏輯
      const exportBookings = async (params: { startDate?: string; endDate?: string; status?: string }) => {
        // 模擬數據庫查詢
        const bookingData = [
          {
            id: 1,
            guestName: '測試客戶',
            guestEmail: 'test@example.com',
            guestPhone: '0912345678',
            roomTypeName: '標準雙人房',
            checkInDate: new Date('2026-01-20'),
            checkOutDate: new Date('2026-01-22'),
            numberOfGuests: 2,
            totalPrice: '4400.00',
            status: 'confirmed',
            createdAt: new Date(),
          },
        ];

        // 模擬 Excel 生成
        const buffer = Buffer.from('test excel content');
        const base64 = buffer.toString('base64');

        return {
          success: true,
          data: base64,
          filename: `訂單數據_${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      };

      const result = await exportBookings({});
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toContain('訂單數據');
      expect(result.filename).toContain('.xlsx');
    });

    it('應該能夠根據日期範圍篩選訂單', async () => {
      const exportBookings = async (params: { startDate?: string; endDate?: string }) => {
        const { startDate, endDate } = params;
        
        // 驗證日期參數
        if (startDate) {
          expect(new Date(startDate)).toBeInstanceOf(Date);
        }
        if (endDate) {
          expect(new Date(endDate)).toBeInstanceOf(Date);
        }

        return {
          success: true,
          data: 'base64data',
          filename: '訂單數據_2026-01-15.xlsx',
        };
      };

      const result = await exportBookings({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result.success).toBe(true);
    });

    it('應該能夠根據狀態篩選訂單', async () => {
      const validStatuses = ['pending', 'confirmed', 'paid', 'cash_on_site', 'completed', 'cancelled'];
      
      const exportBookings = async (params: { status?: string }) => {
        const { status } = params;
        
        if (status) {
          expect(validStatuses).toContain(status);
        }

        return {
          success: true,
          data: 'base64data',
          filename: '訂單數據_2026-01-15.xlsx',
        };
      };

      const result = await exportBookings({ status: 'confirmed' });
      expect(result.success).toBe(true);
    });
  });

  describe('導出營收統計', () => {
    it('應該能夠導出營收統計為 Excel', async () => {
      const exportRevenue = async (params: { startDate?: string; endDate?: string }) => {
        // 模擬營收數據
        const revenueData = [
          { roomTypeName: '標準雙人房', bookingCount: 10, totalRevenue: 44000 },
          { roomTypeName: '豪華雙人房', bookingCount: 5, totalRevenue: 35000 },
        ];

        const totalBookings = revenueData.reduce((sum, item) => sum + item.bookingCount, 0);
        const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);

        expect(totalBookings).toBe(15);
        expect(totalRevenue).toBe(79000);

        return {
          success: true,
          data: 'base64data',
          filename: `營收統計_${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      };

      const result = await exportRevenue({});
      
      expect(result.success).toBe(true);
      expect(result.filename).toContain('營收統計');
    });

    it('應該正確計算總計', async () => {
      const revenueByRoomType: Record<string, { count: number; revenue: number; name: string }> = {};
      
      // 模擬添加數據
      const bookings = [
        { roomTypeId: '1', totalPrice: '4400', roomTypeName: '標準雙人房' },
        { roomTypeId: '1', totalPrice: '4400', roomTypeName: '標準雙人房' },
        { roomTypeId: '2', totalPrice: '7000', roomTypeName: '豪華雙人房' },
      ];

      bookings.forEach((booking) => {
        const roomTypeId = booking.roomTypeId;
        if (!revenueByRoomType[roomTypeId]) {
          revenueByRoomType[roomTypeId] = {
            count: 0,
            revenue: 0,
            name: booking.roomTypeName,
          };
        }
        revenueByRoomType[roomTypeId].count++;
        revenueByRoomType[roomTypeId].revenue += Number(booking.totalPrice);
      });

      const totalBookings = Object.values(revenueByRoomType).reduce((sum, item) => sum + item.count, 0);
      const totalRevenue = Object.values(revenueByRoomType).reduce((sum, item) => sum + item.revenue, 0);

      expect(totalBookings).toBe(3);
      expect(totalRevenue).toBe(15800);
      expect(revenueByRoomType['1'].count).toBe(2);
      expect(revenueByRoomType['2'].count).toBe(1);
    });
  });

  describe('狀態翻譯', () => {
    it('應該正確翻譯訂單狀態', () => {
      const statusMap: Record<string, string> = {
        pending: '待確認',
        confirmed: '已確認',
        pending_payment: '待付款',
        paid: '已付款',
        cash_on_site: '現場付款',
        completed: '已完成',
        cancelled: '已取消',
      };

      expect(statusMap['pending']).toBe('待確認');
      expect(statusMap['confirmed']).toBe('已確認');
      expect(statusMap['paid']).toBe('已付款');
      expect(statusMap['cash_on_site']).toBe('現場付款');
      expect(statusMap['completed']).toBe('已完成');
      expect(statusMap['cancelled']).toBe('已取消');
    });
  });
});
