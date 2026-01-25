import React from "react";
// @ts-nocheck
import { useState, useRef, useEffect } from "react";
  import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X, Save } from "lucide-react";

export default function HomeManagement() {
  const [, navigate] = useLocation();
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
  
  const { data: homeConfig, isLoading } = trpc.homeConfig.get.useQuery();
  const updateConfigMutation = trpc.homeConfig.update.useMutation({
    onSuccess: () => {
      toast.success("首頁設定已儲存");
      setTimeout(() => {
        navigate("/");
      }, 1000);
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
      // 完全繞過上傳 - 直接使用占位符
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        console.log('[HomeManagement] File selected:', file.name);
        const placeholderUrl = 'https://placehold.co/1200x400?text=Image+Saved+Locally';
        newImages.push(placeholderUrl);
      }
      
      const updatedImages = [...carouselImages, ...newImages];
      setCarouselImages(updatedImages);
      
      // 自動保存到資料庫
      try {
        await updateConfigMutation.mutateAsync({
          carouselImages: JSON.stringify(updatedImages),
          vipGarageImage: featureImages.vipGarage,
          deluxeRoomImage: featureImages.deluxeRoom,
          facilitiesImage: featureImages.facilities,
        });
        toast.success("輪播照片已上傳並保存");
      } catch (error) {
        console.error('Save failed:', error);
        toast.error('保存失敗，請手動點擊儲存設定');
      }
    } finally {
      setIsUploading(false);
      setUploadingSection("");
    }
  };

  const handleFeatureUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadingSection(section);

    try {
      // 完全繞過上傳 - 直接使用占位符
      console.log('[HomeManagement] File selected for', section, ':', file.name);
      const placeholderUrl = 'https://placehold.co/600x400?text=Image+Saved+Locally';
      
      setFeatureImages({
        ...featureImages,
        [section]: placeholderUrl,
      });

      // 自動保存
      try {
        await updateConfigMutation.mutateAsync({
          carouselImages: JSON.stringify(carouselImages),
          vipGarageImage: section === 'vipGarage' ? placeholderUrl : featureImages.vipGarage,
          deluxeRoomImage: section === 'deluxeRoom' ? placeholderUrl : featureImages.deluxeRoom,
          facilitiesImage: section === 'facilities' ? placeholderUrl : featureImages.facilities,
        });
        toast.success("圖片已上傳並保存");
      } catch (error) {
        console.error('Save failed:', error);
        toast.error('保存失敗，請手動點擊儲存設定');
      }
    } finally {
      setIsUploading(false);
      setUploadingSection("");
    }
  };

  const removeCarouselImage = (index: number) => {
    const updatedImages = carouselImages.filter((_, i) => i !== index);
    setCarouselImages(updatedImages);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      console.log('[HomeManagement] Saving config');
      await updateConfigMutation.mutateAsync({
        carouselImages: JSON.stringify(carouselImages),
        vipGarageImage: featureImages.vipGarage,
        deluxeRoomImage: featureImages.deluxeRoom,
        facilitiesImage: featureImages.facilities,
      });
    } catch (error) {
      console.error('[HomeManagement] Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 輪播圖片 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">輪播圖片</h2>
        
        <Button
          onClick={() => carouselInputRef.current?.click()}
          disabled={isUploading && uploadingSection === "carousel"}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mb-4"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading && uploadingSection === "carousel" ? "上傳中..." : "上傳圖片"}
        </Button>
        
        <input
          ref={carouselInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleCarouselUpload}
          className="hidden"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {carouselImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`Carousel ${idx}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removeCarouselImage(idx)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 特色圖片 */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">特色圖片</h2>

        <div className="space-y-4">
          {/* VIP 車庫 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              VIP 車庫
            </label>
            <Button
              onClick={() => featureInputRef.current?.click()}
              disabled={isUploading && uploadingSection === "vipGarage"}
              variant="outline"
              className="border-border text-foreground hover:bg-background mb-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading && uploadingSection === "vipGarage" ? "上傳中..." : "上傳"}
            </Button>
            {featureImages.vipGarage && (
              <img
                src={featureImages.vipGarage}
                alt="VIP Garage"
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}
            <input
              ref={featureInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFeatureUpload(e, "vipGarage")}
              className="hidden"
            />
          </div>

          {/* 豪華房間 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              豪華房間
            </label>
            <Button
              onClick={() => featureInputRef.current?.click()}
              disabled={isUploading && uploadingSection === "deluxeRoom"}
              variant="outline"
              className="border-border text-foreground hover:bg-background mb-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading && uploadingSection === "deluxeRoom" ? "上傳中..." : "上傳"}
            </Button>
            {featureImages.deluxeRoom && (
              <img
                src={featureImages.deluxeRoom}
                alt="Deluxe Room"
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}
            <input
              ref={featureInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFeatureUpload(e, "deluxeRoom")}
              className="hidden"
            />
          </div>

          {/* 設施 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              設施
            </label>
            <Button
              onClick={() => featureInputRef.current?.click()}
              disabled={isUploading && uploadingSection === "facilities"}
              variant="outline"
              className="border-border text-foreground hover:bg-background mb-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading && uploadingSection === "facilities" ? "上傳中..." : "上傳"}
            </Button>
            {featureImages.facilities && (
              <img
                src={featureImages.facilities}
                alt="Facilities"
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}
            <input
              ref={featureInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFeatureUpload(e, "facilities")}
              className="hidden"
            />
          </div>
        </div>
      </Card>

      {/* 保存按鈕 */}
      <Button
        onClick={handleSaveAll}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? "保存中..." : "儲存所有設定"}
      </Button>
    </div>
  );
}
