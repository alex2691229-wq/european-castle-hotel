#!/usr/bin/env node

/**
 * 環境檢查腳本
 * 列出所有確保儀表板能顯示數據所需的環境變數
 */

const requiredEnvVars = {
  // 資料庫連接
  'DATABASE_URL': {
    description: '資料庫連接字符串（PostgreSQL/MySQL/SQLite）',
    required: true,
    example: 'postgresql://user:password@localhost:5432/dbname'
  },
  
  // 後端配置
  'PORT': {
    description: '伺服器運行端口',
    required: false,
    example: '3000',
    default: '3000'
  },
  
  'NODE_ENV': {
    description: '運行環境（development/production）',
    required: false,
    example: 'production',
    default: 'production'
  },
  
  // 前端配置
  'VITE_API_URL': {
    description: '前端 API 基礎 URL（可選，預設為相對路徑）',
    required: false,
    example: 'https://your-api.com'
  },
  
  // Vercel 特定配置
  'VERCEL_URL': {
    description: 'Vercel 自動設置的域名',
    required: false,
    example: 'your-app.vercel.app'
  },
  
  // OAuth 配置（如果使用）
  'OAUTH_SERVER_URL': {
    description: 'OAuth 伺服器 URL',
    required: false,
    example: 'https://oauth.example.com'
  },
  
  'JWT_SECRET': {
    description: 'JWT 簽名密鑰',
    required: false,
    example: 'your-secret-key-here'
  },
  
  // 郵件配置（可選）
  'SMTP_HOST': {
    description: 'SMTP 伺服器地址',
    required: false,
    example: 'smtp.gmail.com'
  },
  
  'SMTP_PORT': {
    description: 'SMTP 伺服器端口',
    required: false,
    example: '587'
  },
  
  'SMTP_USER': {
    description: 'SMTP 用戶名',
    required: false,
    example: 'your-email@gmail.com'
  },
  
  'SMTP_PASS': {
    description: 'SMTP 密碼',
    required: false,
    example: 'app-password-here'
  }
};

console.log('\n========================================');
console.log('🔍 歐堡商務汽車旅館 - 環境變數檢查清單');
console.log('========================================\n');

console.log('✅ 必需環境變數（REQUIRED）：\n');
Object.entries(requiredEnvVars).forEach(([key, config]) => {
  if (config.required) {
    const value = process.env[key];
    const status = value ? '✓' : '✗';
    console.log(`  ${status} ${key}`);
    console.log(`    描述：${config.description}`);
    console.log(`    範例：${config.example}`);
    if (!value) {
      console.log(`    ⚠️  未設置！`);
    }
    console.log();
  }
});

console.log('\n⚙️  可選環境變數（OPTIONAL）：\n');
Object.entries(requiredEnvVars).forEach(([key, config]) => {
  if (!config.required) {
    const value = process.env[key];
    const status = value ? '✓' : '○';
    console.log(`  ${status} ${key}`);
    console.log(`    描述：${config.description}`);
    if (config.default) {
      console.log(`    預設值：${config.default}`);
    }
    if (config.example) {
      console.log(`    範例：${config.example}`);
    }
    console.log();
  }
});

console.log('\n========================================');
console.log('📋 Vercel 部署檢查清單：');
console.log('========================================\n');

const checks = [
  {
    name: '資料庫連接',
    key: 'DATABASE_URL',
    critical: true
  },
  {
    name: '伺服器端口',
    key: 'PORT',
    critical: false
  },
  {
    name: '運行環境',
    key: 'NODE_ENV',
    critical: false
  }
];

let allCriticalSet = true;
checks.forEach(check => {
  const value = process.env[check.key];
  const status = value ? '✓' : '✗';
  console.log(`${status} ${check.name} (${check.key})`);
  if (!value && check.critical) {
    allCriticalSet = false;
  }
});

console.log('\n========================================');
if (allCriticalSet) {
  console.log('✅ 所有必需環境變數已設置！');
} else {
  console.log('❌ 部分必需環境變數未設置，請檢查！');
}
console.log('========================================\n');

// 輸出 JSON 格式供程式使用
const envStatus = {
  timestamp: new Date().toISOString(),
  required: Object.entries(requiredEnvVars)
    .filter(([, config]) => config.required)
    .map(([key, config]) => ({
      key,
      description: config.description,
      set: !!process.env[key]
    })),
  optional: Object.entries(requiredEnvVars)
    .filter(([, config]) => !config.required)
    .map(([key, config]) => ({
      key,
      description: config.description,
      set: !!process.env[key],
      default: config.default
    })),
  allCriticalSet
};

console.log('JSON 格式輸出：');
console.log(JSON.stringify(envStatus, null, 2));
