import { Link } from "wouter";

export default function Navbar() {
  const gold = "#d4af37";
  const black = "#000000";

  return (
    <nav style={{ 
      position: 'fixed', top: 0, width: '100%', zIndex: 50, 
      backgroundColor: 'rgba(0,0,0,0.95)', borderBottom: `1px solid ${gold}44`, 
      height: '80px', display: 'flex', alignItems: 'center' 
    }}>
      <div style={{ 
        width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        {/* Logo */}
        <Link href="/">
          <a style={{ color: gold, fontSize: '24px', fontWeight: 'bold', textDecoration: 'none' }}>
            歐堡商務汽車旅館
          </a>
        </Link>

        {/* 導覽連結 - 桌面版 */}
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link href="/rooms"><a style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>房型介紹</a></Link>
          <Link href="/facilities"><a style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>設施服務</a></Link>
          
          {/* 查詢訂單按鈕 (空心金框) */}
          <Link href="/booking-tracking">
            <a style={{ 
              color: gold, border: `1px solid ${gold}`, padding: '8px 16px', 
              borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' 
            }}>
              查詢訂單
            </a>
          </Link>

          {/* 立即訂房按鈕 (實心金底) */}
          <Link href="/booking">
            <a style={{ 
              backgroundColor: gold, color: black, padding: '8px 20px', 
              borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' 
            }}>
              立即訂房
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}