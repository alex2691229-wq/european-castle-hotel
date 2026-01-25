import React from 'react';
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">隱私政策</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            最後更新日期：2026年1月
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. 個人資料收集</h2>
            <p className="text-muted-foreground">
              歐堡商務汽車旅館（以下簡稱「本旅館」）在您使用我們的服務時，可能會收集以下個人資料：
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>姓名、聯絡電話、電子郵件地址</li>
              <li>入住和退房日期、房型偏好</li>
              <li>付款資訊（透過第三方支付平台處理）</li>
              <li>特殊需求或偏好設定</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. 資料使用目的</h2>
            <p className="text-muted-foreground">
              我們收集您的個人資料用於以下目的：
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>處理您的訂房需求和提供住宿服務</li>
              <li>與您聯繫確認訂單或提供客戶服務</li>
              <li>改善我們的服務品質</li>
              <li>遵守法律規定和保護我們的權益</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. 資料保護</h2>
            <p className="text-muted-foreground">
              本旅館採取適當的技術和組織措施來保護您的個人資料，防止未經授權的訪問、使用或洩露。我們使用加密技術來保護敏感資訊的傳輸和存儲。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. 資料分享</h2>
            <p className="text-muted-foreground">
              除非法律要求或經您同意，我們不會將您的個人資料出售、出租或分享給第三方。我們可能會與以下對象分享資料：
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>提供支付處理服務的第三方平台</li>
              <li>協助我們提供服務的合作夥伴（如清潔服務、維護服務）</li>
              <li>法律執行機構（在法律要求的情況下）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. 您的權利</h2>
            <p className="text-muted-foreground">
              您有權：
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>查詢、更正或刪除您的個人資料</li>
              <li>撤回您對資料處理的同意</li>
              <li>要求限制或反對資料處理</li>
              <li>要求資料可攜性</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              如需行使上述權利，請聯繫我們：<a href="mailto:castle6359577@gmail.com" className="text-primary hover:underline">castle6359577@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookie 使用</h2>
            <p className="text-muted-foreground">
              我們的網站使用 Cookie 來改善用戶體驗和分析網站流量。您可以通過瀏覽器設置來管理 Cookie 偏好。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. 政策更新</h2>
            <p className="text-muted-foreground">
              我們可能會不時更新本隱私政策。任何重大變更將在本頁面上公布，並在適用的情況下通知您。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. 聯絡我們</h2>
            <p className="text-muted-foreground">
              如果您對本隱私政策有任何疑問或疑慮，請聯繫我們：
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-2 mt-4">
              <li>電話：<a href="tel:06-635-9577" className="text-primary hover:underline">06-635-9577</a></li>
              <li>電子郵件：<a href="mailto:castle6359577@gmail.com" className="text-primary hover:underline">castle6359577@gmail.com</a></li>
              <li>地址：台南市新營區長榮路一段41號</li>
            </ul>
          </section>
        </div>

        {/* 隱藏的管理登入連結 */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link href="/login">
            <button className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors">
              系統管理
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
