/**
 * 共用郵件模板組件
 * 包含 LINE 加好友按鈕和美化的頁首頁尾
 */

// LINE 官方帳號資訊
export const LINE_ID = '@castle6359577';
export const LINE_ADD_FRIEND_URL = 'https://line.me/R/ti/p/@castle6359577';

// 共用的郵件頁首
export const emailHeader = (title: string, subtitle: string, emoji: string = '🏰', bgColor: string = '#8B7355') => `
  <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 100%); padding: 40px 20px; text-align: center;">
    <div style="max-width: 120px; margin: 0 auto 15px;">
      <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <span style="font-size: 36px;">${emoji}</span>
      </div>
    </div>
    <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 500;">${title}</h1>
    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${subtitle}</p>
  </div>
`;

// 共用的 LINE 加好友區塊
export const lineAddFriendBlock = `
  <div style="background: linear-gradient(135deg, #06C755 0%, #05a847 100%); padding: 25px; text-align: center; margin: 25px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(6, 199, 85, 0.3);">
    <div style="margin-bottom: 15px;">
      <span style="font-size: 32px;">💬</span>
    </div>
    <p style="margin: 0 0 15px 0; color: white; font-size: 16px; font-weight: 500;">
      加入官方 LINE 好友，獲得即時服務
    </p>
    <a href="${LINE_ADD_FRIEND_URL}" 
       style="display: inline-block; background: white; color: #06C755; padding: 14px 40px; 
              border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
      ➕ 加入好友
    </a>
    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
      LINE ID: <strong>${LINE_ID}</strong>
    </p>
  </div>
`;

// 共用的郵件頁尾
export const emailFooter = `
  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
    <div style="margin-bottom: 20px;">
      <a href="${LINE_ADD_FRIEND_URL}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #06C755; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 20px; font-weight: bold;">L</span>
        </div>
      </a>
      <a href="https://www.facebook.com/castlehoteltainan" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #1877F2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 20px; font-weight: bold;">f</span>
        </div>
      </a>
      <a href="tel:06-635-9577" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <div style="width: 44px; height: 44px; background: #8B7355; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <span style="color: white; font-size: 18px;">📞</span>
        </div>
      </a>
    </div>
    <p style="margin: 0 0 8px 0; color: #495057; font-size: 15px; font-weight: 600;">
      歐堡商務汽車旅館
    </p>
    <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 13px;">
      📍 台南市新營區長榮路一段41號
    </p>
    <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 13px;">
      📞 06-635-9577 ｜ ✉️ castle6359577@gmail.com
    </p>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #adb5bd; font-size: 11px;">
        © 2026 歐堡商務汽車旅館有限公司 All Rights Reserved.
      </p>
    </div>
  </div>
`;

// 郵件容器包裝
export const emailWrapper = (content: string) => `
  <div style="font-family: 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    ${content}
  </div>
`;

// 內容區塊
export const contentSection = (content: string) => `
  <div style="padding: 40px 30px;">
    ${content}
  </div>
`;

// 資訊卡片
export const infoCard = (title: string, emoji: string, content: string, borderColor: string = '#8B7355', bgColor: string = '#f8f4f0') => `
  <div style="background: linear-gradient(135deg, ${bgColor} 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${borderColor};">
    <h3 style="margin: 0 0 20px 0; color: ${borderColor}; font-size: 18px;">
      <span style="margin-right: 10px;">${emoji}</span> ${title}
    </h3>
    ${content}
  </div>
`;

// 提示區塊
export const tipBlock = (content: string, bgColor: string = '#fff8e1', borderColor: string = '#ffc107', iconColor: string = '#f57c00') => `
  <div style="background: ${bgColor}; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${borderColor};">
    ${content}
  </div>
`;

// 按鈕
export const actionButton = (text: string, url: string, bgColor: string = '#8B7355') => `
  <div style="text-align: center; margin: 25px 0;">
    <a href="${url}" 
       style="display: inline-block; background: ${bgColor}; color: white; padding: 14px 40px; 
              border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      ${text}
    </a>
  </div>
`;

// 表格行
export const tableRow = (label: string, value: string, isLast: boolean = false, valueStyle: string = '') => `
  <tr>
    <td style="padding: 12px 0; color: #888; font-size: 14px; ${!isLast ? 'border-bottom: 1px solid #eee;' : ''}">${label}</td>
    <td style="padding: 12px 0; font-weight: bold; color: #333; text-align: right; ${!isLast ? 'border-bottom: 1px solid #eee;' : ''} ${valueStyle}">${value}</td>
  </tr>
`;

// 輔助函數：調整顏色深淺
function adjustColor(color: string, amount: number): string {
  // 簡單的顏色調整，返回稍微深一點的顏色
  const colorMap: { [key: string]: string } = {
    '#8B7355': '#6d5a43',
    '#4CAF50': '#388E3C',
    '#ff6b6b': '#e55555',
    '#2196F3': '#1976D2',
    '#9C27B0': '#7B1FA2',
    '#f44336': '#d32f2f',
  };
  return colorMap[color] || color;
}
