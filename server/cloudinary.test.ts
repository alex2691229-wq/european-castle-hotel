import { describe, it, expect } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';

describe('Cloudinary Configuration', () => {
  it('should have valid Cloudinary credentials', () => {
    // 驗證環境變數
    expect(process.env.CLOUDINARY_CLOUD_NAME).toBeDefined();
    expect(process.env.CLOUDINARY_API_KEY).toBeDefined();
    expect(process.env.CLOUDINARY_API_SECRET).toBeDefined();

    // 驗證值不為空
    expect(process.env.CLOUDINARY_CLOUD_NAME).toBe('dqhct1qfx');
    expect(process.env.CLOUDINARY_API_KEY).toBe('958958245666461');
    expect(process.env.CLOUDINARY_API_SECRET).toBe('oNCqQOUmXCTzMCSeCF5o_vSRoWQ');
  });

  it('should configure Cloudinary with valid credentials', () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 驗證配置已設置
    expect(cloudinary.config().cloud_name).toBe('dqhct1qfx');
    expect(cloudinary.config().api_key).toBe('958958245666461');
  });

  it('should generate valid Cloudinary upload signature', () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    // 驗證簽名已生成
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });
});
