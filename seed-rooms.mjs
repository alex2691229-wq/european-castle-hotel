import { drizzle } from "drizzle-orm/mysql2";
import { roomTypes, facilities, news } from "./drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seedData() {
  console.log("開始建立測試資料...");

  // 建立房型
  const rooms = [
    {
      name: "豪華雙人房",
      nameEn: "Deluxe Double Room",
      description: "寬敞舒適的雙人房，配備豪華衛浴設備與獨立車庫，適合商務人士與情侶入住。房間採用Art Deco風格設計，營造優雅奢華的氛圍。",
      descriptionEn: "Spacious and comfortable double room with luxury bathroom facilities and private garage, perfect for business travelers and couples.",
      size: "25坪",
      capacity: 2,
      price: "2800",
      weekendPrice: "3200",
      images: JSON.stringify(["/aLGXkllI60jA.jpg", "/7bImBALYq9l1.jpg"]),
      amenities: JSON.stringify(["獨立車庫", "豪華浴缸", "免費WiFi", "液晶電視", "迷你吧", "空調"]),
      isAvailable: true,
      displayOrder: 1,
    },
    {
      name: "尊榮套房",
      nameEn: "Executive Suite",
      description: "頂級套房空間，擁有獨立客廳與臥室，提供最高規格的住宿體驗。配備按摩浴缸、蒸氣室與豪華寢具，讓您享受帝王般的尊榮感受。",
      descriptionEn: "Premium suite with separate living room and bedroom, offering the highest level of accommodation experience.",
      size: "35坪",
      capacity: 2,
      price: "4200",
      weekendPrice: "4800",
      images: JSON.stringify(["/pFBLqdisXmBi.jpg", "/cz6FcKw42jqQ.jpg"]),
      amenities: JSON.stringify(["獨立車庫", "按摩浴缸", "蒸氣室", "免費WiFi", "65吋電視", "迷你吧", "膠囊咖啡機", "空調"]),
      isAvailable: true,
      displayOrder: 2,
    },
    {
      name: "商務四人房",
      nameEn: "Business Quad Room",
      description: "適合家庭或團體入住的寬敞四人房，配備兩張雙人床與完善的衛浴設施。提供舒適的休憩空間，讓您與親友共享美好時光。",
      descriptionEn: "Spacious quad room suitable for families or groups, equipped with two double beds and complete bathroom facilities.",
      size: "30坪",
      capacity: 4,
      price: "3600",
      weekendPrice: "4200",
      images: JSON.stringify(["/vQhIG5DA9eI6.jpg", "/bHcq5GRVaZdM.jpg"]),
      amenities: JSON.stringify(["獨立車庫", "雙人浴缸", "免費WiFi", "液晶電視", "迷你吧", "空調", "書桌"]),
      isAvailable: true,
      displayOrder: 3,
    },
  ];

  for (const room of rooms) {
    await db.insert(roomTypes).values(room);
    console.log(`已建立房型: ${room.name}`);
  }

  // 建立設施資料
  const facilitiesData = [
    {
      name: "VIP獨立車庫",
      nameEn: "VIP Private Garage",
      description: "每間客房皆配備獨立車庫，確保您的愛車安全與隱私。車庫空間寬敞，方便停車與上下車。",
      descriptionEn: "Each room is equipped with a private garage to ensure the safety and privacy of your vehicle.",
      icon: "Car",
      images: JSON.stringify([]),
      displayOrder: 1,
      isActive: true,
    },
    {
      name: "豪華衛浴設備",
      nameEn: "Luxury Bathroom",
      description: "配備高級衛浴設備，包含按摩浴缸、蒸氣室與頂級盥洗用品，讓您享受極致放鬆的沐浴體驗。",
      descriptionEn: "Equipped with premium bathroom facilities including massage bathtub, steam room, and luxury toiletries.",
      icon: "Bath",
      images: JSON.stringify([]),
      displayOrder: 2,
      isActive: true,
    },
    {
      name: "高速無線網路",
      nameEn: "High-Speed WiFi",
      description: "全館提供高速無線網路，無論是商務需求或休閒娛樂，都能享受流暢的網路體驗。",
      descriptionEn: "High-speed wireless internet throughout the hotel for both business and leisure needs.",
      icon: "Wifi",
      images: JSON.stringify([]),
      displayOrder: 3,
      isActive: true,
    },
    {
      name: "24小時服務",
      nameEn: "24-Hour Service",
      description: "提供全天候專業服務，隨時為您解決各種需求，確保您的住宿體驗完美無瑕。",
      descriptionEn: "Round-the-clock professional service to meet all your needs and ensure a perfect stay.",
      icon: "Clock",
      images: JSON.stringify([]),
      displayOrder: 4,
      isActive: true,
    },
  ];

  for (const facility of facilitiesData) {
    await db.insert(facilities).values(facility);
    console.log(`已建立設施: ${facility.name}`);
  }

  // 建立最新消息
  const newsData = [
    {
      title: "開幕優惠活動",
      titleEn: "Grand Opening Promotion",
      content: "歡慶開幕！即日起至本月底，平日住宿享8折優惠，假日住宿享9折優惠。名額有限，欲訂從速！",
      contentEn: "Celebrating our grand opening! Enjoy 20% off on weekdays and 10% off on weekends until the end of this month.",
      type: "promotion",
      coverImage: "/aLGXkllI60jA.jpg",
      isPublished: true,
    },
    {
      title: "春節訂房開跑",
      titleEn: "Lunar New Year Booking",
      content: "2026春節訂房現已開放！提早預訂享早鳥優惠，讓您與家人共度美好假期。",
      contentEn: "2026 Lunar New Year bookings are now open! Book early for special discounts.",
      type: "announcement",
      coverImage: "/pFBLqdisXmBi.jpg",
      isPublished: true,
    },
    {
      title: "週年慶特惠專案",
      titleEn: "Anniversary Special",
      content: "感謝您的支持！週年慶期間推出多項優惠專案，包含住宿券、餐飲折扣等好康，敬請把握機會！",
      contentEn: "Thank you for your support! Special anniversary offers including accommodation vouchers and dining discounts.",
      type: "event",
      coverImage: "/cz6FcKw42jqQ.jpg",
      isPublished: true,
    },
  ];

  for (const item of newsData) {
    await db.insert(news).values(item);
    console.log(`已建立消息: ${item.title}`);
  }

  console.log("測試資料建立完成！");
  process.exit(0);
}

seedData().catch((error) => {
  console.error("建立測試資料時發生錯誤:", error);
  process.exit(1);
});
