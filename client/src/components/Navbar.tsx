import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Calendar } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo - 確保文字一定顯示 */}
        <Link href="/">
          <div className="text-xl md:text-2xl font-bold text-[#d4af37] cursor-pointer">
            歐堡商務汽車旅館
          </div>
        </Link>

        {/* 中間導航 - 強制取消隱藏條件 */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/rooms"><a className="text-zinc-300 hover:text-[#d4af37] transition-colors cursor-pointer">房型介紹</a></Link>
          <Link href="/facilities"><a className="text-zinc-300 hover:text-[#d4af37] transition-colors cursor-pointer">設施服務</a></Link>
          <Link href="/transportation"><a className="text-zinc-300 hover:text-[#d4af37] transition-colors cursor-pointer">交通資訊</a></Link>
          <Link href="/news"><a className="text-zinc-300 hover:text-[#d4af37] transition-colors cursor-pointer">最新消息</a></Link>
        </div>

        {/* 右側按鈕組 */}
        <div className="flex items-center gap-3">
          <Link href="/booking-tracking">
            <Button variant="outline" className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all">
              <Search className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">查詢訂單</span>
            </Button>
          </Link>
          <Link href="/booking">
            <Button className="bg-[#d4af37] hover:bg-[#b8962e] text-black font-bold">
              <Calendar className="w-4 h-4 mr-2" />
              立即訂房
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}