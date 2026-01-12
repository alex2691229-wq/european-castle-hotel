import { Link } from "wouter";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">歐堡商務汽車旅館</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              位於台南新營的精緻商務汽車旅館，提供舒適優雅的住宿環境，是您商務出差與休閒旅遊的最佳選擇。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => window.location.href = '/rooms'} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                  客房介紹
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/facilities'} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                  設施服務
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/news'} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                  最新消息
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/booking'} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                  線上訂房
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">聯絡資訊</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  台南市新營區長榮路一段41號
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-primary flex-shrink-0" />
                <a 
                  href="tel:06-6359577" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  06-635-9577
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-primary flex-shrink-0" />
                <a 
                  href="mailto:castle6359577@gmail.com" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  castle6359577@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">追蹤我們</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/castlehoteltainan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-border flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all"
                aria-label="Facebook"
              >
                <Facebook size={20} className="text-foreground" />
              </a>
              <a
                href="#"
                className="w-10 h-10 border border-border flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all"
                aria-label="Instagram"
              >
                <Instagram size={20} className="text-foreground" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} 歐堡商務汽車旅館有限公司. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <button onClick={() => window.location.href = '/privacy'} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              隱私政策
            </button>
            <button onClick={() => window.location.href = '/terms'} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              服務條款
            </button>
          </div>
        </div>
      </div>

      {/* Art Deco decorative element */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
    </footer>
  );
}
