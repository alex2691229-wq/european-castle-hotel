/**
 * 日期選擇器壓力測試腳本
 * 模擬 100 次隨機日期選擇與清除操作
 * 測試日期選擇器的穩定性和數據持久化能力
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const TEST_CONFIG = {
  url: 'http://localhost:3000/booking',
  testIterations: 100,
  timeout: 30000,
  headless: true,
  resultsFile: path.join(__dirname, 'stress-test-results.json'),
};

// 生成隨機日期（未來 30 天內）
function generateRandomDate() {
  const today = new Date();
  const daysOffset = Math.floor(Math.random() * 30) + 1;
  const randomDate = new Date(today);
  randomDate.setDate(randomDate.getDate() + daysOffset);
  
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, '0');
  const day = String(randomDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 格式化日期為顯示格式
function formatDateForDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

// 執行單次測試
async function runSingleTest(page, testNumber) {
  try {
    // 選擇房型
    await page.click('select');
    await page.select('select', '1'); // 選擇第一個房型
    await page.waitForTimeout(500);

    // 生成隨機日期
    const checkInDate = generateRandomDate();
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    const checkOutDateStr = checkOutDate.toISOString().split('T')[0];

    // 填寫入住日期
    const checkInInputs = await page.$$('input[type="date"]');
    if (checkInInputs.length === 0) {
      throw new Error('找不到日期輸入欄位');
    }

    // 清除舊值
    await page.evaluate((selector) => {
      const inputs = document.querySelectorAll(selector);
      inputs.forEach(input => input.value = '');
    }, 'input[type="date"]');

    // 設置新日期
    await checkInInputs[0].evaluate((el, value) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, checkInDate);

    await page.waitForTimeout(300);

    // 驗證入住日期是否被保存
    const checkInValue = await checkInInputs[0].evaluate(el => el.value);
    if (checkInValue !== checkInDate) {
      throw new Error(`入住日期未保存: 期望 ${checkInDate}, 實際 ${checkInValue}`);
    }

    // 設置退房日期
    if (checkInInputs.length > 1) {
      await checkInInputs[1].evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, checkOutDateStr);

      await page.waitForTimeout(300);

      // 驗證退房日期是否被保存
      const checkOutValue = await checkInInputs[1].evaluate(el => el.value);
      if (checkOutValue !== checkOutDateStr) {
        throw new Error(`退房日期未保存: 期望 ${checkOutDateStr}, 實際 ${checkOutValue}`);
      }
    }

    // 測試清除日期
    await page.evaluate((selector) => {
      const inputs = document.querySelectorAll(selector);
      inputs.forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }, 'input[type="date"]');

    await page.waitForTimeout(300);

    // 驗證日期是否被清除
    const clearedCheckInValue = await checkInInputs[0].evaluate(el => el.value);
    if (clearedCheckInValue !== '') {
      throw new Error(`入住日期未清除: 期望空值, 實際 ${clearedCheckInValue}`);
    }

    return {
      testNumber,
      status: 'PASS',
      checkInDate,
      checkOutDate: checkOutDateStr,
      message: '日期選擇、保存、清除操作成功',
    };
  } catch (error) {
    return {
      testNumber,
      status: 'FAIL',
      error: error.message,
      message: `測試失敗: ${error.message}`,
    };
  }
}

// 主測試函數
async function runStressTest() {
  console.log('🚀 開始日期選擇器壓力測試...');
  console.log(`📊 測試配置: ${TEST_CONFIG.testIterations} 次迭代`);
  console.log(`🌐 目標 URL: ${TEST_CONFIG.url}`);
  console.log('');

  let browser;
  const results = {
    startTime: new Date().toISOString(),
    config: TEST_CONFIG,
    tests: [],
    summary: {
      total: TEST_CONFIG.testIterations,
      passed: 0,
      failed: 0,
      successRate: 0,
    },
  };

  try {
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(TEST_CONFIG.timeout);

    // 導航到訂房頁面
    console.log('📍 導航到訂房頁面...');
    await page.goto(TEST_CONFIG.url, { waitUntil: 'networkidle2' });
    console.log('✅ 頁面加載完成\n');

    // 執行壓力測試
    for (let i = 1; i <= TEST_CONFIG.testIterations; i++) {
      process.stdout.write(`\r⏳ 執行測試 ${i}/${TEST_CONFIG.testIterations}...`);
      
      const testResult = await runSingleTest(page, i);
      results.tests.push(testResult);

      if (testResult.status === 'PASS') {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }

      // 每 10 次測試後稍微等待
      if (i % 10 === 0) {
        await page.waitForTimeout(500);
      }
    }

    console.log('\n');

    // 計算成功率
    results.summary.successRate = (results.summary.passed / results.summary.total * 100).toFixed(2);
    results.endTime = new Date().toISOString();

    // 關閉瀏覽器
    await browser.close();

    // 保存結果
    fs.writeFileSync(TEST_CONFIG.resultsFile, JSON.stringify(results, null, 2));

    // 輸出摘要
    console.log('📈 測試摘要:');
    console.log(`   總測試數: ${results.summary.total}`);
    console.log(`   ✅ 通過: ${results.summary.passed}`);
    console.log(`   ❌ 失敗: ${results.summary.failed}`);
    console.log(`   📊 成功率: ${results.summary.successRate}%`);
    console.log(`\n📁 詳細結果已保存到: ${TEST_CONFIG.resultsFile}`);

    // 如果有失敗，顯示失敗詳情
    if (results.summary.failed > 0) {
      console.log('\n❌ 失敗的測試:');
      results.tests
        .filter(t => t.status === 'FAIL')
        .slice(0, 10)
        .forEach(t => {
          console.log(`   測試 #${t.testNumber}: ${t.message}`);
        });
      if (results.summary.failed > 10) {
        console.log(`   ... 還有 ${results.summary.failed - 10} 個失敗的測試`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ 測試執行失敗:', error.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// 執行測試
runStressTest().then(results => {
  process.exit(results.summary.failed > 0 ? 1 : 0);
});
