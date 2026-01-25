import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">
            服務條款
          </h1>
          <p className="text-lg text-primary-foreground/90">
            歐堡商務汽車旅館服務條款與政策
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="prose prose-invert max-w-none">
          {/* Last Updated */}
          <div className="mb-8 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">最後更新日期：</span> 2026 年 1 月 13 日
            </p>
          </div>

          {/* Section 1 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                1. 服務條款的接受
              </h2>
              <p className="text-muted-foreground mb-4">
                當您訪問並使用歐堡商務汽車旅館網站或預訂我們的服務時，即表示您已閱讀、理解並同意受本服務條款的約束。如果您不同意本條款的任何部分，請勿使用本網站或預訂我們的服務。
              </p>
              <p className="text-muted-foreground">
                我們保留隨時修改本服務條款的權利。修改後的條款將在網站上發布，並自發布之日起生效。您繼續使用本網站或服務即表示接受修改後的條款。
              </p>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                2. 訂房政策
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    2.1 訂房確認
                  </h3>
                  <p>
                    所有訂房必須通過本網站或致電飯店進行。訂房確認後，我們將通過電子郵件或電話向您發送確認信息。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    2.2 入住和退房時間
                  </h3>
                  <p>
                    標準入住時間為下午 3:00，退房時間為上午 11:00。如需提前入住或延遲退房，請提前聯繫飯店。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    2.3 房間可用性
                  </h3>
                  <p>
                    房間可用性取決於庫存情況。我們將盡力滿足您的房型偏好，但不保證特定房型的可用性。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                3. 取消和退款政策
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    3.1 免費取消
                  </h3>
                  <p>
                    大多數訂房可在入住前 7 天內免費取消。具體取消政策因房型和預訂時間而異。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    3.2 取消程序
                  </h3>
                  <p>
                    如需取消訂房，請通過網站、電話或電子郵件通知我們。取消確認後，我們將發送確認信息。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    3.3 退款時間
                  </h3>
                  <p>
                    符合條件的退款將在取消後 5-10 個工作日內處理，具體時間取決於您的銀行。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                4. 付款條款
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    4.1 付款方式
                  </h3>
                  <p>
                    我們接受主要信用卡、銀行轉帳和其他付款方式。具體付款選項將在訂房時顯示。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    4.2 價格保證
                  </h3>
                  <p>
                    網站上顯示的價格為確認訂房時的價格。價格包括房費，但不包括稅費和服務費（如適用）。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    4.3 付款安全
                  </h3>
                  <p>
                    我們使用行業標準的加密技術保護您的付款信息。您的信用卡信息不會存儲在我們的服務器上。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                5. 客人責任
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    5.1 房間使用
                  </h3>
                  <p>
                    客人應妥善使用房間及其設施。任何損壞或遺失的物品將按照實際成本向客人收費。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    5.2 行為準則
                  </h3>
                  <p>
                    客人應遵守飯店的所有規則和政策。禁止任何非法活動、騷擾或擾亂他人的行為。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    5.3 貴重物品
                  </h3>
                  <p>
                    飯店不對客人遺失或被盜的貴重物品負責。建議使用房間內的保險箱存放貴重物品。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                6. 飯店責任限制
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  在適用法律允許的最大範圍內，歐堡商務汽車旅館對因使用本網站或服務而引起的任何間接、附帶、特殊或後果性損害不承擔責任。
                </p>
                <p>
                  飯店對以下情況不承擔責任：
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>客人的個人物品遺失或被盜</li>
                  <li>由於客人行為導致的傷害或損害</li>
                  <li>因不可抗力（如自然災害）導致的服務中斷</li>
                  <li>第三方提供的服務質量問題</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                7. 隱私政策
              </h2>
              <p className="text-muted-foreground mb-4">
                我們重視您的隱私。請查看我們的隱私政策以了解我們如何收集、使用和保護您的個人信息。
              </p>
              <p className="text-muted-foreground">
                通過使用本網站，您同意我們按照隱私政策中所述的方式收集和使用您的信息。
              </p>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                8. 知識產權
              </h2>
              <p className="text-muted-foreground mb-4">
                本網站上的所有內容，包括文本、圖像、標誌和設計，均受著作權和其他知識產權法律保護。
              </p>
              <p className="text-muted-foreground">
                未經我們明確書面同意，您不得複製、修改、分發或以其他方式使用本網站上的任何內容。
              </p>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                9. 免責聲明
              </h2>
              <p className="text-muted-foreground mb-4">
                本網站「按原樣」提供，不提供任何明示或暗示的保證。我們不保證網站的準確性、完整性或及時性。
              </p>
              <p className="text-muted-foreground">
                我們不對因使用或無法使用本網站而引起的任何損害負責。
              </p>
            </CardContent>
          </Card>

          {/* Section 10 */}
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-serif mb-4">
                10. 聯繫我們
              </h2>
              <p className="text-muted-foreground mb-4">
                如對本服務條款有任何疑問或需要進一步信息，請聯繫我們：
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <span className="font-semibold">電話：</span> 06-635-9577
                </p>
                <p>
                  <span className="font-semibold">電子郵件：</span>{" "}
                  castle6359577@gmail.com
                </p>
                <p>
                  <span className="font-semibold">地址：</span>{" "}
                  台南市新營區長榮路一段41號
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Final Note */}
          <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              本服務條款受台灣法律管轄。任何法律爭議應在台灣法院提起。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
