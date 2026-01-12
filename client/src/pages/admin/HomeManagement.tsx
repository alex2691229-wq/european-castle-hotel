import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload, X, Save } from "lucide-react";

export default function HomeManagement() {
  const [carouselImages, setCarouselImages] = useState<string[]>([
    "/hotel_exterior_night.webp",
    "/hotel_exterior_day.webp",
  ]);
  
  const [featureImages, setFeatureImages] = useState({
    vipGarage: "/aLGXkllI60jA.jpg",
    deluxeRoom: "/bHcq5GRVaZdM.jpg",
    facilities: "/pFBLqdisXmBi.jpg",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<string>("");
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.upload.image.useMutation();

  const handleCarouselUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    setUploadingSection("carousel");
    
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            if (base64) {
              try {
                const result = await uploadMutation.mutateAsync({
                  filename: file.name,
                  data: base64,
                });
                newImages.push(result.url);
              } catch (error) {
                console.error('Upload failed:', error);
              }
            }
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      }
      setCarouselImages([...carouselImages, ...newImages]);
      toast.success("輪播照片已上傳");
    } finally {
      setIsUploading(false);
      setUploadingSection("");
      if (carouselInputRef.current) {
        carouselInputRef.current.value = '';
      }
    }
  };

  const handleFeatureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: keyof typeof featureImages
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadingSection(section);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        if (base64) {
          try {
            const result = await uploadMutation.mutateAsync({
              filename: file.name,
              data: base64,
            });
            setFeatureImages({
              ...featureImages,
              [section]: result.url,
            });
            toast.success("特色照片已更新");
          } catch (error) {
            console.error('Upload failed:', error);
            toast.error("上傳失敗");
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      setUploadingSection("");
      if (featureInputRef.current) {
        featureInputRef.current.value = '';
      }
    }
  };

  const removeCarouselImage = (index: number) => {
    setCarouselImages(carouselImages.filter((_, i) => i !== index));
    toast.success("照片已移除");
  };

  const handleSave = () => {
    // Save to localStorage for now
    localStorage.setItem('homeCarouselImages', JSON.stringify(carouselImages));
    localStorage.setItem('homeFeatureImages', JSON.stringify(featureImages));
    toast.success("首頁設定已儲存");
  };

  return (
    <div className="space-y-6">
      {/* Carousel Images */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">首頁輪播照片</h2>
        
        <div className="mb-4">
          <Button
            onClick={() => carouselInputRef.current?.click()}
            disabled={isUploading && uploadingSection === "carousel"}
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/10"
          >
            {isUploading && uploadingSection === "carousel" ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                上傳中...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                上傳輪播照片
              </>
            )}
          </Button>
          <input
            ref={carouselInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleCarouselUpload}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {carouselImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`輪播照片 ${idx + 1}`}
                className="w-full h-40 object-cover rounded border border-border"
              />
              <button
                onClick={() => removeCarouselImage(idx)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature Images */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">特色區域照片</h2>
        
        <div className="space-y-6">
          {/* VIP Garage */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">VIP 車庫</h3>
            <div className="flex items-start gap-4">
              <img
                src={featureImages.vipGarage}
                alt="VIP 車庫"
                className="w-48 h-32 object-cover rounded border border-border"
              />
              <div>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFeatureUpload(e as any, 'vipGarage');
                    input.click();
                  }}
                  disabled={isUploading && uploadingSection === "vipGarage"}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  {isUploading && uploadingSection === "vipGarage" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      更換照片
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  建議尺寸：800x600 像素
                </p>
              </div>
            </div>
          </div>

          {/* Deluxe Room */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">精緻客房</h3>
            <div className="flex items-start gap-4">
              <img
                src={featureImages.deluxeRoom}
                alt="精緻客房"
                className="w-48 h-32 object-cover rounded border border-border"
              />
              <div>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFeatureUpload(e as any, 'deluxeRoom');
                    input.click();
                  }}
                  disabled={isUploading && uploadingSection === "deluxeRoom"}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  {isUploading && uploadingSection === "deluxeRoom" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      更換照片
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  建議尺寸：800x600 像素
                </p>
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">設施服務</h3>
            <div className="flex items-start gap-4">
              <img
                src={featureImages.facilities}
                alt="設施服務"
                className="w-48 h-32 object-cover rounded border border-border"
              />
              <div>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFeatureUpload(e as any, 'facilities');
                    input.click();
                  }}
                  disabled={isUploading && uploadingSection === "facilities"}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  {isUploading && uploadingSection === "facilities" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      更換照片
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  建議尺寸：800x600 像素
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="w-4 h-4 mr-2" />
          儲存設定
        </Button>
      </div>
    </div>
  );
}
