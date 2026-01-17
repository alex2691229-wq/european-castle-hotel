import { Link } from "wouter";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 border-b border-[#d4af37]/50 h-20 flex items-center">
      <div className="container mx-auto px-4 flex justify-between items-center w-full">
        {/* 左側 Logo */}
        <Link href="/">
          <a className="text-xl md:text-2xl font-bold text-[#d4af37] cursor-pointer shrink-0">
            歐堡商務汽車旅館
          </a>
        </Link>

        {/* 中間選單：刪除所有 hidden 屬性，強制 flex */}
        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto no-scrollbar">
          <Link href="/rooms"><a className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm">房型介紹</a></Link>
          <Link href="/facilities"><a className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm">設施服務</a></Link>
          <Link href="/transportation"><a className="text-white hover:text-[#d4af37] cursor-pointer whitespace-nowrap text-sm">交通資訊</a></Link>
        </div>

        {/* 右側按鈕 */}
        <div className="flex gap-2 md:gap-4 items-center shrink-0">
          <Link href="/booking-tracking">
            <a className="text-[#d4af37] border border-[#d4af37] px-2 py-1 md:px-4 md:py-2 rounded-md font-bold text-xs md:text-sm">
              查詢訂單
            </a>
          </Link>
          <Link href="/booking">
            <a className="bg-[#d4af37] text-black px-2 py-1 md:px-5 md:py-2 rounded-md font-bold text-xs md:text-sm">
              立即訂房
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}