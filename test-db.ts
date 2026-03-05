import mysql from 'mysql2/promise';

async function testConnection() {
  // 注意：網址後面的 ?ssl=true 已經拿掉了
  const dbUrl = "mysql://2p8ob8h7CK7Zznh.root:vNmR8q3aVoJTs6To@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test";

  try {
    console.log("⏳ 正在嘗試連線到 TiDB 雲端資料庫...");
    
    // 將網址和 SSL 設定分開傳入 (以物件形式)
    const connection = await mysql.createConnection({
      uri: dbUrl,
      ssl: {
        rejectUnauthorized: true // 這是連接雲端資料庫標準的 SSL 設定
      }
    });
    
    console.log("🎉 連線成功！你的 TiDB 雲端資料庫運作正常！");
    
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log("📡 資料庫回應測試：", rows);

    await connection.end();
    
  } catch (error) {
    console.error("❌ 連線失敗，請檢查以下錯誤訊息：");
    console.error(error);
  }
}

testConnection();