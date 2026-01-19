// @ts-nocheck
import { v2 as cloudinary } from 'cloudinary';

/**
 * 初始化 Cloudinary
 */
export function initializeCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * 上傳圖片到 Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `hotel-rooms/${Date.now()}-${filename.replace(/\s+/g, '-')}`,
        folder: 'hotel-rooms',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          console.log(`[Cloudinary] Upload successful: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Cloudinary upload failed: No result'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * 刪除 Cloudinary 上的圖片
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Delete result:`, result);
    return result.result === 'ok';
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    return false;
  }
}
