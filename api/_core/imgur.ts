import axios from 'axios';

/**
 * Imgur 圖片上傳工具
 * 使用 Imgur API 上傳圖片並返回 URL
 */

const IMGUR_API_URL = "https://api.imgur.com/3/image";

export async function uploadToImgur(
  imageData: string | Buffer,
  clientId: string
): Promise<{ url: string; deleteHash: string }> {
  try {
    // 如果是 Buffer，轉換為 Base64
    const base64Data =
      typeof imageData === "string"
        ? imageData
        : imageData.toString("base64");

    const response = await axios.post(IMGUR_API_URL, base64Data, {
      headers: {
        Authorization: `Client-ID ${clientId}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: `image=${base64Data}&type=base64`,
    });

    if (response.data.success) {
      return {
        url: response.data.data.link,
        deleteHash: response.data.data.deletehash,
      };
    } else {
      throw new Error(`Imgur upload failed: ${response.data.data.error}`);
    }
  } catch (error) {
    console.error("[Imgur] Upload failed:", error);
    throw new Error(`Failed to upload image to Imgur: ${error.message}`);
  }
}

/**
 * 從 URL 下載圖片並上傳到 Imgur
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  clientId: string
): Promise<{ url: string; deleteHash: string }> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data);
    return uploadToImgur(imageBuffer, clientId);
  } catch (error) {
    console.error("[Imgur] Upload from URL failed:", error);
    throw new Error(`Failed to upload image from URL: ${error.message}`);
  }
}

/**
 * 刪除 Imgur 上的圖片
 */
export async function deleteFromImgur(
  deleteHash: string,
  clientId: string
): Promise<boolean> {
  try {
    const response = await axios.delete(
      `https://api.imgur.com/3/image/${deleteHash}`,
      {
        headers: {
          Authorization: `Client-ID ${clientId}`,
        },
      }
    );

    return response.data.success;
  } catch (error) {
    console.error("[Imgur] Delete failed:", error);
    return false;
  }
}
