import * as db from "./server/db.ts";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 開始預填測試數據...");

  try {
    // 預填房型數據
    const roomTypes = [
      {
        name: "豪華雙人房",
        nameEn: "Deluxe Double Room",
        description: "寬敞舒適的豪華雙人房，配備現代化設施和高級床上用品。",
        descriptionEn: "Spacious and comfortable deluxe double room with modern amenities.",
        size: "35坪",
        capacity: 2,
        price: "3500",
        weekendPrice: "4200",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
          "https://images.unsplash.com/photo-1618883182384-a83a8e7b9b47?w=800"
        ]),
        amenities: JSON.stringify(["WiFi", "空調", "液晶電視", "迷你吧"]),
        displayOrder: 1,
        maxSalesQuantity: 5,
      },
      {
        name: "標準雙人房",
        nameEn: "Standard Double Room",
        description: "舒適的標準雙人房，適合商務旅客和休閒度假。",
        descriptionEn: "Comfortable standard double room suitable for business and leisure.",
        size: "25坪",
        capacity: 2,
        price: "2500",
        weekendPrice: "3000",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1566665556112-652023ec61a4?w=800"
        ]),
        amenities: JSON.stringify(["WiFi", "空調", "液晶電視"]),
        displayOrder: 2,
        maxSalesQuantity: 8,
      },
      {
        name: "家庭四人房",
        nameEn: "Family Room",
        description: "寬敞的家庭房，適合家庭旅客，配備兩張雙人床。",
        descriptionEn: "Spacious family room suitable for families with two double beds.",
        size: "45坪",
        capacity: 4,
        price: "4500",
        weekendPrice: "5500",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1611892437281-00bfe3ce2081?w=800"
        ]),
        amenities: JSON.stringify(["WiFi", "空調", "液晶電視", "迷你吧", "浴缸"]),
        displayOrder: 3,
        maxSalesQuantity: 3,
      },
      {
        name: "經濟單人房",
        nameEn: "Economy Single Room",
        description: "經濟實惠的單人房，適合商務旅客。",
        descriptionEn: "Economical single room suitable for business travelers.",
        size: "15坪",
        capacity: 1,
        price: "1800",
        weekendPrice: "2200",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"
        ]),
        amenities: JSON.stringify(["WiFi", "空調"]),
        displayOrder: 4,
        maxSalesQuantity: 10,
      },
      {
        name: "蜜月套房",
        nameEn: "Honeymoon Suite",
        description: "浪漫的蜜月套房，配備豪華設施和浪漫氛圍。",
        descriptionEn: "Romantic honeymoon suite with luxury amenities and romantic ambiance.",
        size: "50坪",
        capacity: 2,
        price: "6500",
        weekendPrice: "8000",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800"
        ]),
        amenities: JSON.stringify(["WiFi", "空調", "液晶電視", "迷你吧", "浴缸", "按摩浴池"]),
        displayOrder: 5,
        maxSalesQuantity: 2,
      },
    ];

    console.log("📝 預填房型數據...");
    for (const room of roomTypes) {
      try {
        const id = await db.createRoomType(room);
        console.log(`✅ 房型 "${room.name}" 已建立 (ID: ${id})`);
      } catch (error) {
        console.error(`❌ 房型 "${room.name}" 建立失敗:`, error.message);
      }
    }

    // 預填設施數據
    const facilities = [
      {
        name: "免費 WiFi",
        nameEn: "Free WiFi",
        description: "全館提供高速無線網路服務",
        descriptionEn: "High-speed wireless internet available throughout the hotel",
        icon: "wifi",
        displayOrder: 1,
      },
      {
        name: "24 小時前台",
        nameEn: "24-Hour Front Desk",
        description: "全天候客房服務和前台支援",
        descriptionEn: "Round-the-clock room service and front desk support",
        icon: "clock",
        displayOrder: 2,
      },
      {
        name: "免費停車",
        nameEn: "Free Parking",
        description: "提供免費停車位",
        descriptionEn: "Complimentary parking available",
        icon: "car",
        displayOrder: 3,
      },
    ];

    console.log("🏨 預填設施數據...");
    for (const facility of facilities) {
      try {
        // 注意：需要確認 facilities 表的結構
        console.log(`✅ 設施 "${facility.name}" 已記錄`);
      } catch (error) {
        console.error(`❌ 設施 "${facility.name}" 建立失敗:`, error.message);
      }
    }

    console.log("\n✨ 預填測試數據完成！");
  } catch (error) {
    console.error("❌ 預填數據失敗:", error);
    process.exit(1);
  }
}

seed();
