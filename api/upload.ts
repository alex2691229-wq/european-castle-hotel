import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqhct1qfx',
});

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
    // GET 請求：返回上傳簽名（用於客戶端上傳）
    if (req.method === 'GET') {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dqhct1qfx';
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'european_castle_hotel';
      
      return res.status(200).json({
        success: true,
        cloudName,
        uploadPreset,
        message: 'Cloudinary upload configuration'
      });
    }

    // POST 請求：處理 base64 圖片上傳
    if (req.method === 'POST') {
      console.log('[Upload] Received upload request');
      
      const { imageData, filename } = req.body;

      if (!imageData) {
        return res.status(400).json({
          error: 'Missing image data',
          message: '缺少圖片數據'
        });
      }

      // 驗證 base64 格式
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({
          error: 'Invalid image format',
          message: '無效的圖片格式，需要 base64 編碼的圖片'
        });
      }

      console.log('[Upload] Uploading image:', filename || 'unnamed');

      try {
        // 使用 Cloudinary 上傳 base64 圖片
        const uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: 'european-castle-hotel/rooms',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
          overwrite: true,
        });

        console.log('[Upload] Upload successful:', uploadResult.secure_url);

        return res.status(200).json({
          success: true,
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          message: '圖片上傳成功'
        });
      } catch (uploadError) {
        console.error('[Upload] Cloudinary error:', uploadError);
        throw uploadError;
      }
    }

    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 GET 和 POST 請求'
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : '圖片上傳失敗',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}
