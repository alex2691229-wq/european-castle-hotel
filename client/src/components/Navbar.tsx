import React from 'react';
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("登出失敗:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 border-b border-[#d4af37]/50 h-20 flex items-center">
      <div className="container mx-auto px-4 flex justify-between items-center w-full">
        
        {/* 左侧 Logo */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer shrink-0">
          <div className="w-10 h-10 border-2 border-[#d4af37] flex items-center justify-center rounded-sm">
            <span className="text-[#d4af37] font-bold text-lg">E</span>
          </div>
          <span className="text-xs md:text-sm font-bold text-white hidden sm:inline">
            <div>歐堡商務決車旅館</div>
            <div className="text-[#d4af37] text-xs">EUROPEAN CASTLE HOTEL</div>
          </span>
        </Link>

        {/* 中間選單 */}
        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto no-scrollbar">
          <Link href="/rooms" className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">房型介紹</Link>
          <Link href="/facilities" className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">設施服務</Link>
          <Link href="/transportation" className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">交通資訊</Link>
          <Link href="/news" className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">最新消息</Link>
        </div>

        {/* 右侧按鈕 */}
        <div className="flex gap-2 md:gap-4 items-center shrink-0">
          {loading ? (
            <span className="text-gray-400 text-xs md:text-sm">載入中...</span>
          ) : isAuthenticated && user ? (
            <>
              <span className="text-gray-300 text-xs md:text-sm">👤 {user.name || user.username || "管理員"}</span>
              <Link href="/admin" className="text-[#d4af37] border border-[#d4af37] px-2 py-1 md:px-4 md:py-2 rounded-md font-bold text-xs md:text-sm hover:bg-[#d4af37]/10 transition-colors">
                進入後台
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-gray-300 hover:text-[#d4af37] transition-colors text-xs md:text-sm font-medium disabled:opacity-50"
              >
                {isLoggingOut ? "登出中..." : "登出"}
              </button>
            </>
          ) : (
            <Link href="/login" className="text-gray-300 hover:text-[#d4af37] transition-colors text-xs md:text-sm font-medium">
              管理員登入
            </Link>
          )}

          <Link href="/booking-tracking" className="text-[#d4af37] border border-[#d4af37] px-2 py-1 md:px-4 md:py-2 rounded-md font-bold text-xs md:text-sm hover:bg-[#d4af37]/10 transition-colors">
            查詢訂單
          </Link>
          <Link href="/booking" className="bg-[#d4af37] text-black px-2 py-1 md:px-5 md:py-2 rounded-md font-bold text-xs md:text-sm hover:bg-[#d4af37]/90 transition-colors">
            立即訂房
          </Link>
        </div>
      </div>
    </nav>
  );
}