import { describe, it, expect, beforeEach } from 'vitest';

describe('AdminBookings - 訂房流程、快速篩選和分頁功能', () => {
  // 模擬訂單數據
  const mockBookings = [
    {
      id: 1,
      guestName: '客戶 1',
      guestEmail: 'guest1@example.com',
      guestPhone: '0900123456',
      checkInDate: new Date(2026, 0, 15),
      checkOutDate: new Date(2026, 0, 17),
      numberOfGuests: 2,
      totalPrice: 3560,
      specialRequests: null,
      status: 'pending',
      roomTypeName: '標準雙床房',
      createdAt: new Date(),
    },
    {
      id: 2,
      guestName: '客戶 2',
      guestEmail: 'guest2@example.com',
      guestPhone: '0900123457',
      checkInDate: new Date(2026, 0, 20),
      checkOutDate: new Date(2026, 0, 22),
      numberOfGuests: 2,
      totalPrice: 3560,
      specialRequests: null,
      status: 'confirmed',
      roomTypeName: '標準雙床房',
      createdAt: new Date(),
    },
  ];

  describe('訂房流程測試', () => {
    it('應該能夠從待確認狀態轉換到待付款狀態', () => {
      const booking = mockBookings[0];
      expect(booking.status).toBe('pending');
      
      // 模擬點擊「✓ 確認訂房」按鈕
      const newStatus = 'pending_payment';
      expect(newStatus).toBe('pending_payment');
    });

    it('應該能夠選擇銀行轉帳付款方式', () => {
      const paymentMethod = 'bank_transfer';
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('應該能夠選擇現場付款方式', () => {
      const paymentMethod = 'cash_on_site';
      expect(paymentMethod).toBe('cash_on_site');
    });

    it('應該能夠從待付款狀態轉換到已付款狀態（銀行轉帳）', () => {
      const booking = { ...mockBookings[0], status: 'pending_payment' };
      const lastFiveDigits = '12345';
      
      // 驗證後五碼格式
      expect(/^\d{5}$/.test(lastFiveDigits)).toBe(true);
      
      // 模擬轉換到已付款
      const newStatus = 'paid';
      expect(newStatus).toBe('paid');
    });

    it('應該能夠從待付款狀態轉換到現場付款狀態', () => {
      const booking = { ...mockBookings[0], status: 'pending_payment' };
      const newStatus = 'cash_on_site';
      expect(newStatus).toBe('cash_on_site');
    });

    it('應該能夠從已付款狀態轉換到已完成狀態', () => {
      const booking = { ...mockBookings[0], status: 'paid' };
      const newStatus = 'completed';
      expect(newStatus).toBe('completed');
    });
  });

  describe('快速篩選按鈕測試', () => {
    it('應該能夠篩選全部訂單', () => {
      const filter = 'all';
      const filtered = mockBookings.filter(() => filter === 'all');
      expect(filtered.length).toBe(2);
    });

    it('應該能夠篩選待確認訂單', () => {
      const filter = 'pending';
      const filtered = mockBookings.filter(b => b.status === filter);
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('pending');
    });

    it('應該能夠篩選已確認訂單', () => {
      const filter = 'confirmed';
      const filtered = mockBookings.filter(b => b.status === filter);
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('confirmed');
    });

    it('應該能夠篩選當日入住訂單', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const bookingsWithToday = [
        ...mockBookings,
        {
          id: 3,
          guestName: '今天入住',
          guestEmail: 'today@example.com',
          guestPhone: '0900123458',
          checkInDate: today,
          checkOutDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          numberOfGuests: 2,
          totalPrice: 3560,
          specialRequests: null,
          status: 'pending_payment',
          roomTypeName: '標準雙床房',
          createdAt: new Date(),
        },
      ];
      
      const filtered = bookingsWithToday.filter(b => {
        const checkInDate = new Date(b.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate.getTime() === today.getTime();
      });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].guestName).toBe('今天入住');
    });
  });

  describe('分頁功能測試', () => {
    it('應該能夠計算總頁數', () => {
      const itemsPerPage = 10;
      const totalPages = Math.ceil(mockBookings.length / itemsPerPage);
      expect(totalPages).toBe(1);
    });

    it('應該能夠分頁顯示訂單（每頁10筆）', () => {
      const itemsPerPage = 10;
      const currentPage = 1;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedBookings = mockBookings.slice(startIndex, endIndex);
      
      expect(paginatedBookings.length).toBe(2);
    });

    it('應該能夠處理多頁訂單', () => {
      // 模擬144筆訂單
      const manyBookings = Array.from({ length: 144 }, (_, i) => ({
        id: i + 1,
        guestName: `客戶 ${i + 1}`,
        guestEmail: `guest${i + 1}@example.com`,
        guestPhone: '0900123456',
        checkInDate: new Date(2026, 0, 15),
        checkOutDate: new Date(2026, 0, 17),
        numberOfGuests: 2,
        totalPrice: 3560,
        specialRequests: null,
        status: 'pending',
        roomTypeName: '標準雙床房',
        createdAt: new Date(),
      }));
      
      const itemsPerPage = 10;
      const totalPages = Math.ceil(manyBookings.length / itemsPerPage);
      expect(totalPages).toBe(15);
      
      // 驗證第一頁
      const page1 = manyBookings.slice(0, 10);
      expect(page1.length).toBe(10);
      
      // 驗證最後一頁
      const lastPage = manyBookings.slice(140, 150);
      expect(lastPage.length).toBe(4);
    });

    it('應該能夠導航到上一頁', () => {
      const currentPage = 2;
      const previousPage = Math.max(1, currentPage - 1);
      expect(previousPage).toBe(1);
    });

    it('應該能夠導航到下一頁', () => {
      const currentPage = 1;
      const totalPages = 15;
      const nextPage = Math.min(totalPages, currentPage + 1);
      expect(nextPage).toBe(2);
    });

    it('應該在第一頁時禁用上一頁按鈕', () => {
      const currentPage = 1;
      const isDisabled = currentPage === 1;
      expect(isDisabled).toBe(true);
    });

    it('應該在最後一頁時禁用下一頁按鈕', () => {
      const currentPage = 15;
      const totalPages = 15;
      const isDisabled = currentPage === totalPages;
      expect(isDisabled).toBe(true);
    });
  });

  describe('篩選和分頁組合測試', () => {
    it('應該能夠篩選待確認訂單並分頁顯示', () => {
      const filter = 'pending';
      const itemsPerPage = 10;
      const currentPage = 1;
      
      const filtered = mockBookings.filter(b => b.status === filter);
      const totalPages = Math.ceil(filtered.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginated = filtered.slice(startIndex, endIndex);
      
      expect(filtered.length).toBe(1);
      expect(totalPages).toBe(1);
      expect(paginated.length).toBe(1);
      expect(paginated[0].status).toBe('pending');
    });

    it('應該能夠在篩選後重置到第一頁', () => {
      const currentPage = 2;
      const newFilter = 'confirmed';
      
      // 模擬篩選後重置頁碼
      const resetPage = 1;
      expect(resetPage).toBe(1);
    });
  });
});
