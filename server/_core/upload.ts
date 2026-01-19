import { Request, Response } from 'express';
import { uploadToImgur } from './imgur';

/**
 * POST /api/upload 路由處理器
 * 接收檔案並上傳到 Imgur
 */
export async function handleUpload(req: Request, res: Response) {
  try {
    // 檢查是否有檔案
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // 檢查 Imgur Client ID
    const clientId = process.env.IMGUR_CLIENT_ID;
    if (!clientId) {
      console.error('[Upload] IMGUR_CLIENT_ID not configured');
      return res.status(500).json({
        success: false,
        error: 'Imgur Client ID not configured',
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

    // 檢查檔案大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 5MB limit',
      });
    }

    console.log(`[Upload] Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

    // 上傳到 Imgur
    const result = await uploadToImgur(req.file.buffer, clientId);

    console.log(`[Upload] Successfully uploaded to Imgur: ${result.url}`);

    // 返回成功響應
    return res.json({
      success: true,
      data: {
        url: result.url,
        deleteHash: result.deleteHash,
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
