import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from './db.js';
import { roomTypes, news, facilities } from '../drizzle/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[debug-seed] Seeding database...');

    const db = await getDB();
    if (!db) {
      console.error('[debug-seed] Database connection failed');
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Check and seed room types
    console.log('[debug-seed] Checking room types...');
    const existingRooms = await db.select().from(roomTypes);
    console.log('[debug-seed] Existing rooms:', existingRooms.length);

    if (existingRooms.length === 0) {
      console.log('[debug-seed] Seeding room types...');
      const defaultRooms = [
        {
          name: '豪華套房',
          nameEn: 'Luxury Suite',
          description: '寬敞舒適的豪華套房，配備獨立車庫和高級設施',
          descriptionEn: 'Spacious luxury suite with private garage and premium amenities',
          size: '50坪',
          capacity: 4,
          price: '3500',
          weekendPrice: '4500',
          maxSalesQuantity: 5,
          images: null,
          amenities: JSON.stringify(['獨立車庫', '豪華衛浴', '高速 Wi-Fi', '液晶電視']),
          isAvailable: true,
          displayOrder: 1,
        },
        {
          name: '商務客房',
          nameEn: 'Business Room',
          description: '設計簡潔的商務客房，適合出差住宿',
          descriptionEn: 'Well-designed business room perfect for business travelers',
          size: '30坪',
          capacity: 2,
          price: '2500',
          weekendPrice: '3200',
          maxSalesQuantity: 10,
          images: null,
          amenities: JSON.stringify(['獨立車庫', '工作區', '高速 Wi-Fi', '淋浴間']),
          isAvailable: true,
          displayOrder: 2,
        },
        {
          name: '標準客房',
          nameEn: 'Standard Room',
          description: '舒適實惠的標準客房，提供基本設施',
          descriptionEn: 'Comfortable and affordable standard room with basic amenities',
          size: '25坪',
          capacity: 2,
          price: '1800',
          weekendPrice: '2300',
          maxSalesQuantity: 15,
          images: null,
          amenities: JSON.stringify(['獨立車庫', '基本設施', 'Wi-Fi', '浴室']),
          isAvailable: true,
          displayOrder: 3,
        },
      ];

      for (const room of defaultRooms) {
        await db.insert(roomTypes).values(room as any);
      }
      console.log('[debug-seed] Room types seeded');
    }

    // Check and seed news
    console.log('[debug-seed] Checking news...');
    const existingNews = await db.select().from(news);
    console.log('[debug-seed] Existing news:', existingNews.length);

    if (existingNews.length === 0) {
      console.log('[debug-seed] Seeding news...');
      const defaultNews = [
        {
          title: '春季優惠活動',
          titleEn: 'Spring Promotion',
          content: '本月推出春季優惠方案',
          contentEn: 'Spring promotion plan available this month',
          type: 'promotion' as const,
          coverImage: null,
          isPublished: true,
        },
        {
          title: '新年特別優惠',
          titleEn: 'New Year Special',
          content: '新年期間享受特別優惠',
          contentEn: 'Special offers during New Year',
          type: 'promotion' as const,
          coverImage: null,
          isPublished: true,
        },
      ];

      for (const newsItem of defaultNews) {
        await db.insert(news).values(newsItem);
      }
      console.log('[debug-seed] News seeded');
    }

    // Check and seed facilities
    console.log('[debug-seed] Checking facilities...');
    const existingFacilities = await db.select().from(facilities);
    console.log('[debug-seed] Existing facilities:', existingFacilities.length);

    if (existingFacilities.length === 0) {
      console.log('[debug-seed] Seeding facilities...');
      const defaultFacilities = [
        {
          name: '免費 Wi-Fi',
          nameEn: 'Free Wi-Fi',
          description: '全館覆蓋高速無線網絡',
          descriptionEn: 'High-speed wireless network throughout the hotel',
          icon: 'wifi',
          images: null,
          displayOrder: 1,
          isActive: true,
        },
        {
          name: '游泳池',
          nameEn: 'Swimming Pool',
          description: '室內溫水游泳池',
          descriptionEn: 'Indoor heated swimming pool',
          icon: 'waves',
          images: null,
          displayOrder: 2,
          isActive: true,
        },
        {
          name: '免費停車',
          nameEn: 'Free Parking',
          description: '提供免費停車位',
          descriptionEn: 'Complimentary parking available',
          icon: 'car',
          images: null,
          displayOrder: 3,
          isActive: true,
        },
      ];

      for (const facility of defaultFacilities) {
        await db.insert(facilities).values(facility as any);
      }
      console.log('[debug-seed] Facilities seeded');
    }

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      stats: {
        rooms: existingRooms.length > 0 ? existingRooms.length : 3,
        news: existingNews.length > 0 ? existingNews.length : 2,
        facilities: existingFacilities.length > 0 ? existingFacilities.length : 3,
      },
    });
  } catch (error) {
    console.error('[debug-seed] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: 'Seeding failed',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
