import { Link } from "wouter";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 border-b border-[#d4af37]/30 h-20 flex items-center backdrop-blur-md">
      <div className="container mx-auto px-4 flex justify-between items-center w-full">
        {/* Logo */}
        <Link href="/">
          <a className="text-2xl font-bold text-[#d4af37] cursor-pointer hover:opacity-80 transition-opacity">
            歐堡商務汽車旅館
          </a>
        </Link>

        {/* 導覽選單 */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/rooms"><a className="text-gray-200 hover:text-[#d4af37] transition-colors cursor-pointer text-sm font-medium">房型介紹</a></Link>
          <Link href="/facilities"><a className="text-gray-200 hover:text-[#d4af37] transition-colors cursor-pointer text-sm font-medium">設施服務</a></Link>
          <Link href="/transportation"><a className="text-gray-200 hover:text-[#d4af37] transition-colors cursor-pointer text-sm font-medium">交通資訊</a></Link>
        </div>

        {/* 右側按鈕 */}
        <div className="flex gap-4 items-center">
          <Link href="/booking-tracking">
            <a className="text-[#d4af37] border border-[#d4af37] px-4 py-2 rounded-md hover:bg-[#d4af37] hover:text-black transition-all text-sm font-bold">
              查詢訂單
            </a>
          </Link>
          <Link href="/booking">
            <a className="bg-[#d4af37] text-black px-5 py-2 rounded-md font-bold hover:bg-[#b8962d] transition-all text-sm">
              立即訂房
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}