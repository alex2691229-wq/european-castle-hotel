import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { getDB, getAllRoomTypes } from './db.js';
import { appRouter } from './routers.js';
import { createContext } from './_core/context.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // tRPC Handler
    if (req.url?.includes('/api/trpc')) {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      
      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: new Request(url, {
          method: req.method,
          headers: req.headers as HeadersInit,
          body: req.method !== 'GET' && req.method !== 'HEAD' 
            ? JSON.stringify(req.body) 
            : undefined,
        }),
        router: appRouter,
        createContext: async () => createContext({ req, res }),
      });

      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
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
