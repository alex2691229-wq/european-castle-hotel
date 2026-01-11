import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Maximize2, ArrowLeft, Check, Upload, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

export default function RoomDetail() {
  const [, params] = useRoute("/rooms/:id");
  const roomId = params?.id ? parseInt(params.id) : 0;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.upload.image.useMutation();

  const { data: room, isLoading } = trpc.roomTypes.getById.useQuery(
    { id: roomId },
    { enabled: roomId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-20">
          <div className="text-center text-muted-foreground">載入中...</div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">找不到此房型</h2>
            <Link href="/rooms">
              <Button>返回客房列表</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = room.images ? JSON.parse(room.images) : [];
  const amenities = room.amenities ? JSON.parse(room.amenities) : [];
  const allImages = [...images, ...uploadedImages];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          if (base64) {
            try {
              const result = await uploadMutation.mutateAsync({
                filename: file.name,
                data: base64,
              });
              setUploadedImages((prev) => [...prev, result.url]);
            } catch (error) {
              console.error('Upload failed:', error);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Back Button */}
      <div className="container mx-auto py-6">
        <Link href="/rooms">
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            <ArrowLeft size={20} className="mr-2" />
            返回客房列表
          </Button>
        </Link>
      </div>

      {/* Photo Management Section */}
      <section className="container mx-auto mb-12">
        <Card className="bg-card border-border shadow-luxury">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">房型照片管理</h3>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    上傳中...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    選擇圖片
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-3">新上傳的照片：</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`上傳的照片 ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() =>
                          setUploadedImages(uploadedImages.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Image Gallery */}
      <section className="container mx-auto mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main Image */}
          <div className="relative h-96 lg:h-[600px] overflow-hidden shadow-luxury">
            <img
              src={allImages[currentImageIndex] || "/placeholder-room.jpg"}
              alt={`${room.name} ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 gap-4">
            {allImages.slice(0, 4).map((img: string, idx: number) => (
              <div
                key={idx}
                className={`relative h-44 lg:h-[290px] overflow-hidden cursor-pointer transition-all ${
                  idx === currentImageIndex
                    ? "border-4 border-primary shadow-luxury"
                    : "border-2 border-border hover:border-primary"
                }`}
                onClick={() => setCurrentImageIndex(idx)}
              >
                <img
                  src={img}
                  alt={`${room.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === currentImageIndex && (
                  <div className="absolute inset-0 bg-primary/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Details */}
      <section className="container mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Room Info */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border shadow-luxury">
              <CardContent className="p-8">
                {/* Title */}
                <div className="mb-8 art-deco-border">
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                    {room.name}
                  </h1>
                  <p className="text-xl text-muted-foreground tracking-wider">
                    {room.nameEn || ""}
                  </p>
                </div>

                {/* Quick Info */}
                <div className="flex items-center space-x-8 mb-8 pb-8 border-b border-border">
                  {room.size && (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 border-2 border-primary flex items-center justify-center">
                        <Maximize2 size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">房間大小</p>
                        <p className="text-lg font-semibold text-foreground">{room.size}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 border-2 border-primary flex items-center justify-center">
                      <Users size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">可入住人數</p>
                      <p className="text-lg font-semibold text-foreground">
                        最多 {room.capacity} 人
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">房型介紹</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {room.description}
                  </p>
                  {room.descriptionEn && (
                    <p className="text-muted-foreground/70 leading-relaxed mt-4">
                      {room.descriptionEn}
                    </p>
                  )}
                </div>

                {/* Amenities */}
                {amenities.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">房間設施</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {amenities.map((amenity: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <Check size={20} className="text-primary flex-shrink-0" />
                          <span className="text-foreground">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div>
            <Card className="bg-card border-border shadow-luxury sticky top-24">
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">平日起</p>
                  <p className="text-4xl font-bold text-primary mb-1">
                    NT$ {Number(room.price).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">/晚</p>
                </div>

                <Link href="/booking">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 mb-3">
                    立即訂房
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/10"
                >
                  詢問房型
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
