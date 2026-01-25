import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    if (req.method === 'POST') {
      console.log('[Upload] Received upload request');
      
      // Placeholder response - returns a mock image URL
      return res.status(200).json({
        success: true,
        url: '/images/placeholder.jpg',
        message: 'Image upload placeholder',
      });
    }

    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}
