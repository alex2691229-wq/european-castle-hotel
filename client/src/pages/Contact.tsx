// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendMessageMutation = trpc.contact.send.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !message) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        name,
        email,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
      });

      toast.success("訊息已送出！我們將盡快回覆您。");
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "送出失敗，請稍後再試");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/bHcq5GRVaZdM.jpg"
            alt="Contact"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center">
          <div className="corner-frame">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-gold-gradient">
              聯絡我們
            </h1>
            <p className="text-xl text-muted-foreground tracking-wider">
              CONTACT US
            </p>
          </div>
        </div>
        <div className="absolute inset-0 geometric-bg pointer-events-none opacity-30" />
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  留下您的訊息
                </h2>
                <p className="text-muted-foreground">
                  有任何問題或需求，歡迎透過表單與我們聯繫，我們將盡快回覆您
                </p>
              </div>

              <Card className="bg-card border-border shadow-luxury">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-foreground mb-2 block">
                        姓名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="請輸入您的姓名"
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-foreground mb-2 block">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="請輸入您的 Email"
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-foreground mb-2 block">
                        電話
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="請輸入您的電話號碼"
                        className="bg-background border-border"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-foreground mb-2 block">
                        主旨
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="請輸入主旨"
                        className="bg-background border-border"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-foreground mb-2 block">
                        訊息內容 <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="請輸入您的訊息"
                        className="bg-background border-border min-h-[150px]"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? "送出中..." : "送出訊息"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  聯絡資訊
                </h2>
                <p className="text-muted-foreground">
                  您也可以透過以下方式直接與我們聯繫
                </p>
              </div>

              <div className="space-y-6">
                {/* Address */}
                <Card className="bg-card border-border shadow-luxury">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 border-2 border-primary flex items-center justify-center flex-shrink-0">
                        <MapPin size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">地址</h3>
                        <p className="text-muted-foreground">
                          台南市新營區長榮路一段41號
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phone */}
                <Card className="bg-card border-border shadow-luxury">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 border-2 border-primary flex items-center justify-center flex-shrink-0">
                        <Phone size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">電話</h3>
                        <a 
                          href="tel:06-6359577" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          06-635-9577
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">24小時服務專線</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email */}
                <Card className="bg-card border-border shadow-luxury">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 border-2 border-primary flex items-center justify-center flex-shrink-0">
                        <Mail size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Email</h3>
                        <a 
                          href="mailto:info@europeancastle.com.tw" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          info@europeancastle.com.tw
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours */}
                <Card className="bg-card border-border shadow-luxury">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 border-2 border-primary flex items-center justify-center flex-shrink-0">
                        <Clock size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">服務時間</h3>
                        <div className="space-y-1 text-muted-foreground">
                          <p>入住時間：下午 5:00 後</p>
                          <p>退房時間：中午 12:00 前</p>
                          <p className="text-sm mt-2">24小時櫃檯服務</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
