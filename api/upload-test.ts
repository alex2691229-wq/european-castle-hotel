import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from './db.js';
import { roomTypes } from '../drizzle/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[upload-test] Received request:', JSON.stringify(req.body, null, 2));

    const { name, description, price, capacity, images } = req.body;

    // Validate input
    if (!name || !description || !price || !capacity) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: { name, description, price, capacity },
      });
    }

    // Get database connection
    const db = await getDB();
    if (!db) {
      console.error('[upload-test] Database connection failed');
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Direct insert using Drizzle
    console.log('[upload-test] Inserting room type:', { name, description, price, capacity });

    const result = await db.insert(roomTypes).values({
      name,
      description,
      price: price.toString(),
      capacity: parseInt(capacity),
      images: images || null,
      isAvailable: true,
      displayOrder: 0,
    });

    console.log('[upload-test] Insert result:', result);

    return res.status(200).json({
      success: true,
      message: 'Room type created successfully',
      result,
    });
  } catch (error) {
    console.error('[upload-test] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: 'Failed to create room type',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
