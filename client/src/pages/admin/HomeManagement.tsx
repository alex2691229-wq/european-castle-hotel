import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X, Save } from "lucide-react";

export default function HomeManagement() {
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [featureImages, setFeatureImages] = useState({
    vipGarage: "",
    deluxeRoom: "",
    facilities: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = trpc.upload.image.useMutation();
  const { data: homeConfig, isLoading } = trpc.homeConfig.get.useQuery();
  const updateConfigMutation = trpc.homeConfig.update.useMutation({
    onSuccess: () => {
      toast.success("首頁設定已儲存");
    },
    onError: (error) => {
      toast.error(`儲存失敗：${error.message}`);
    },
  });

  // 初始化數據
  useEffect(() => {
    if (homeConfig) {
      try {
        const carouselImgs = homeConfig.carouselImages 
          ? JSON.parse(homeConfig.carouselImages) 
          : [];
        setCarouselImages(Array.isArray(carouselImgs) ? carouselImgs : []);
        
        setFeatureImages({
          vipGarage: homeConfig.vipGarageImage || "",
          deluxeRoom: homeConfig.deluxeRoomImage || "",
          facilities: homeConfig.facilitiesImage || "",
        });
      } catch (error) {
        console.error("Failed to parse home config:", error);
        setCarouselImages([]);
      }
    }
  }, [homeConfig]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfigMutation.mutateAsync({
        carouselImages: JSON.stringify(carouselImages),
        vipGarageImage: featureImages.vipGarage,
        deluxeRoomImage: featureImages.deluxeRoom,
        facilitiesImage: featureImages.facilities,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Carousel Images */}
      <Card className="p-6 bg-black/40 border-gold/20">
        <h2 className="text-xl font-bold text-gold mb-4">首頁輪播照片</h2>
        
        <div className="mb-4">
          <Button
            onClick={() => carouselInputRef.current?.click()}
            disabled={isUploading && uploadingSection === "carousel"}
            className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
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
                className="w-full h-40 object-cover rounded border border-gold/30"
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
        {carouselImages.length === 0 && (
          <p className="text-gray-400 text-center py-8">還未上傳任何輪播照片</p>
        )}
      </Card>

      {/* Feature Images */}
      <Card className="p-6 bg-black/40 border-gold/20">
        <h2 className="text-xl font-bold text-gold mb-4">特色區域照片</h2>
        
        <div className="space-y-6">
          {/* VIP Garage */}
          <div>
            <h3 className="text-lg font-semibold text-gold mb-2">VIP 車庫</h3>
            <div className="flex items-start gap-4">
              {featureImages.vipGarage ? (
                <img
                  src={featureImages.vipGarage}
                  alt="VIP 車庫"
                  className="w-48 h-32 object-cover rounded border border-gold/30"
                />
              ) : (
                <div className="w-48 h-32 bg-black/60 rounded border border-gold/30 flex items-center justify-center">
                  <span className="text-gray-400">未設定照片</span>
                </div>
              )}
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
                  className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
                >
                  {isUploading && uploadingSection === "vipGarage" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {featureImages.vipGarage ? "更換照片" : "上傳照片"}
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-400 mt-2">
                  建議尺寸：800x600 像素
                </p>
              </div>
            </div>
          </div>

          {/* Deluxe Room */}
          <div>
            <h3 className="text-lg font-semibold text-gold mb-2">精緻客房</h3>
            <div className="flex items-start gap-4">
              {featureImages.deluxeRoom ? (
                <img
                  src={featureImages.deluxeRoom}
                  alt="精緻客房"
                  className="w-48 h-32 object-cover rounded border border-gold/30"
                />
              ) : (
                <div className="w-48 h-32 bg-black/60 rounded border border-gold/30 flex items-center justify-center">
                  <span className="text-gray-400">未設定照片</span>
                </div>
              )}
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
                  className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
                >
                  {isUploading && uploadingSection === "deluxeRoom" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {featureImages.deluxeRoom ? "更換照片" : "上傳照片"}
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-400 mt-2">
                  建議尺寸：800x600 像素
                </p>
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-semibold text-gold mb-2">設施服務</h3>
            <div className="flex items-start gap-4">
              {featureImages.facilities ? (
                <img
                  src={featureImages.facilities}
                  alt="設施服務"
                  className="w-48 h-32 object-cover rounded border border-gold/30"
                />
              ) : (
                <div className="w-48 h-32 bg-black/60 rounded border border-gold/30 flex items-center justify-center">
                  <span className="text-gray-400">未設定照片</span>
                </div>
              )}
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
                  className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
                >
                  {isUploading && uploadingSection === "facilities" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {featureImages.facilities ? "更換照片" : "上傳照片"}
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-400 mt-2">
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
          disabled={isSaving}
          className="bg-gold text-black hover:bg-gold/90 font-semibold"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              儲存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              儲存設定
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
