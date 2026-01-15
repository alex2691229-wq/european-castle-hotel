import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { href: "/", label: "首頁" },
    { href: "/rooms", label: "客房介紹" },
    { href: "/facilities", label: "設施服務" },
    { href: "/news", label: "最新消息" },
    { href: "/location", label: "交通資訊" },
    { href: "/contact", label: "聯絡我們" },
        { href: "/booking-tracking", label: "📋 追蹤訂單" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all" />
              <div className="relative w-12 h-12 border-2 border-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">E</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">歐堡商務汽車旅館</h1>
              <p className="text-xs text-muted-foreground tracking-wider">EUROPEAN CASTLE HOTEL</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/booking">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                立即訂房
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline">
                      後台管理
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={() => logout()}>
                  登出
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost">
                  登入
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
              ))}
              
              <Link href="/booking">
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  立即訂房
                </Button>
              </Link>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      管理後台
                    </Button>
                  </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    登出
                  </Button>
                </>
              ) : (
                        <Link href="/track-booking">
              <button
                variant="ghost"
                className="w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                追蹤訂單
              </button>
            </Link>
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    登入
                  </Button>
                </Link>
              )}
            </div>
            // Force redeploy - trigger build
          </div>
        )}
      </div>
    </nav>
  );
}
