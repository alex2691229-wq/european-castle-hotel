import mysql from 'mysql2/promise';

async function viewUsers() {
  const dbUrl = "mysql://2p8ob8h7CK7Zznh.root:vNmR8q3aVoJTs6To@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test";
  
  try {
    const connection = await mysql.createConnection({
      uri: dbUrl,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("🔍 正在撈取 users 表格資料...");
    const [rows] = await connection.query('SELECT * FROM users;');
    
    // 把結果印得漂漂亮亮的
    console.log(JSON.stringify(rows, null, 2));
    
    await connection.end();
  } catch (error) {
    console.error("❌ 讀取失敗：", error);
  }
}

viewUsers();