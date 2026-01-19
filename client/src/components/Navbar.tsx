import { Link } from "wouter";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 border-b border-[#d4af37]/50 h-20 flex items-center">
      <div className="container mx-auto px-4 flex justify-between items-center w-full">
        {/* 左侧 Logo - 金色邊框 E */}
        <Link href="/">
          <a className="flex items-center gap-3 cursor-pointer shrink-0">
            <div className="w-10 h-10 border-2 border-[#d4af37] flex items-center justify-center rounded-sm">
              <span className="text-[#d4af37] font-bold text-lg">E</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-white hidden sm:inline">
              <div>歐堡商務決車旅館</div>
              <div className="text-[#d4af37] text-xs">EUROPEAN CASTLE HOTEL</div>
            </span>
          </a>
        </Link>

        {/* 中間選單 */}
        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto no-scrollbar">
          <Link href="/rooms">
            <a className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">房型介紹</a>
          </Link>
          <Link href="/facilities">
            <a className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">設施服務</a>
          </Link>
          <Link href="/transportation">
            <a className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm transition-colors">交通資訊</a>
          </Link>
        </div>

        {/* 版本標記 */}
        <div className="text-[#d4af37]/50 text-xs hidden lg:block mr-4">
          v2.0-Verified
        </div>

        {/* 右侧按鈕 */}
        <div className="flex gap-2 md:gap-4 items-center shrink-0">
          <Link href="/login">
            <a className="text-gray-300 hover:text-[#d4af37] transition-colors text-xs md:text-sm font-medium">
              管理員登入
            </a>
          </Link>
          <Link href="/booking-tracking">
            <a className="text-[#d4af37] border border-[#d4af37] px-2 py-1 md:px-4 md:py-2 rounded-md font-bold text-xs md:text-sm hover:bg-[#d4af37]/10 transition-colors">
              查詢訂單
            </a>
          </Link>
          <Link href="/booking">
            <a className="bg-[#d4af37] text-black px-2 py-1 md:px-5 md:py-2 rounded-md font-bold text-xs md:text-sm hover:bg-[#d4af37]/90 transition-colors">
              立即訂房
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}
