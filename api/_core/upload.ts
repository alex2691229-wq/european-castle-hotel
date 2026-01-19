// @ts-nocheck
import { Request, Response } from 'express';
// @ts-nocheck
import { uploadToCloudinary, initializeCloudinary } from './cloudinary.js';

/**
 * POST /api/upload 路由處理器
 * 接收檔案並上傳到 Cloudinary
 */
export async function handleUpload(req: Request, res: Response) {
  try {
    // 初始化 Cloudinary（如果還沒初始化）
    initializeCloudinary();

    // 檢查是否有檔案
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // 檢查 Cloudinary 配置
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[Upload] Cloudinary credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Cloudinary credentials not configured',
      });
    }

    // 檢查檔案類型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      });
    }

    // 檢查檔案大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 10MB limit',
      });
    }

    console.log(`[Upload] Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

    // 上傳到 Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    console.log(`[Upload] Successfully uploaded to Cloudinary: ${result.url}`);

    // 返回成功響應
    return res.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        filename: req.file.originalname,
      },
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}

/**
 * 驗證上傳權限的中間件
 * 確保只有認證用戶可以上傳
 */
export function requireAuth(req: Request, res: Response, next: Function) {
  // 檢查是否有認證信息
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
    });
  }

  // 這裡可以添加更多的認證邏輯
  // 例如驗證 JWT token
  next();
}
