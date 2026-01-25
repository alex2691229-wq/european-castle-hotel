import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import bcryptjs from 'bcryptjs';

import { getDB, getAllRoomTypes, seedFacilitiesIfEmpty, seedNewsIfEmpty, seedRoomTypesIfEmpty } from './db.js';
import { appRouter } from './routers.js';
import { createContext } from './_core/context.js';
import { seedAdminAccount } from './seed-admin.js';
import { roomTypes, news, facilities, users } from '../drizzle/schema.js';

// Seed data on startup
let seedingPromise: Promise<void> | null = null;

async function ensureSeeding() {
  if (!seedingPromise) {
    seedingPromise = Promise.all([
      seedAdminAccount().catch(error => {
        console.error('[Startup] Failed to seed admin account:', error);
      }),
      seedRoomTypesIfEmpty().catch(error => {
        console.error('[Startup] Failed to seed room types:', error);
      }),
      seedFacilitiesIfEmpty().catch(error => {
        console.error('[Startup] Failed to seed facilities:', error);
      }),
      seedNewsIfEmpty().catch(error => {
        console.error('[Startup] Failed to seed news:', error);
      }),
    ]).then(() => {});
  }
  return seedingPromise;
}

// 初始化 seeding
ensureSeeding().catch(error => {
  console.error('[Init] Seeding error:', error);
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure seeding is complete
  try {
    await ensureSeeding();
  } catch (error) {
    console.error('[Handler] Seeding error:', error);
  }
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Health Check - Database
    if (req.url?.includes('/api/health/db')) {
      try {
        const db = getDB();
        if (!db) {
          return res.status(500).json({
            status: 'error',
            message: 'Database not initialized'
          });
        }

        // Test connection
        await db.execute(sql`SELECT 1 as test`);
        
        return res.json({
          status: 'connected',
          message: 'Database connection successful',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: error instanceof Error ? error.message : 'Database connection failed',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Status Check
    if (req.url?.includes('/api/status')) {
      return res.json({
        env: process.env.NODE_ENV || 'development',
        db: 'check_pending',
        version: 'Production-v2.1-Clean',
        timestamp: new Date().toISOString()
      });
    }

    // Room Types API
    if (req.url?.includes('/api/room-types')) {
      try {
        const roomTypes = await getAllRoomTypes();
        return res.json(roomTypes);
      } catch (error) {
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to fetch room types'
        });
      }
    }

    // Debug Seed Route
    if (req.url?.includes('/api/debug-seed')) {
      try {
        console.log('[debug-seed] Seeding database...');

        const db = await getDB();
        if (!db) {
          console.error('[debug-seed] Database connection failed');
          return res.status(500).json({ error: 'Database connection failed' });
        }

        // Check and seed admin user
        console.log('[debug-seed] Checking admin user...');
        const existingUsers = await db.select().from(users);
        console.log('[debug-seed] Existing users:', existingUsers.length);

        if (existingUsers.length === 0) {
          console.log('[debug-seed] Creating admin user...');
          const hashedPassword = bcryptjs.hashSync('123456', 10);
          await db.insert(users).values({
            username: 'admin',
            passwordHash: hashedPassword,
            email: 'admin@hotel.com',
            name: 'Administrator',
            role: 'admin',
            loginMethod: 'password',
            status: 'active',
          });
          console.log('[debug-seed] Admin user created');
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

    // tRPC Handler - 使用官方 fetchRequestHandler
    if (req.url?.startsWith('/api/trpc')) {
      console.log('[DEBUG] Request URL:', req.url);
      console.log('[DEBUG] Request Method:', req.method);
      
      // 構建完整的請求 URL - 保留完整路徑
      const fullUrl = `http://${req.headers.host || 'localhost'}${req.url}`;
      console.log('[DEBUG] Full URL for fetchRequestHandler:', fullUrl);
      
      // 使用官方 fetchRequestHandler
      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: new Request(fullUrl, {
          method: req.method,
          headers: req.headers as HeadersInit,
          body: req.method !== 'GET' && req.method !== 'HEAD' 
            ? JSON.stringify(req.body) 
            : undefined,
        }),
        router: appRouter,
        createContext: async () => createContext({ req, res }),
      });

      console.log('[TRPC Response] Status:', response.status);

      // 設置響應狀態和頭部
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      // 發送響應體
      const body = await response.text();
      return res.send(body);
    }

    // Default 404
    return res.status(404).json({
      error: 'Not found'
    });
  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
