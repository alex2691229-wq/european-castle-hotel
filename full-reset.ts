import mysql from 'mysql2/promise';

async function fullReset() {
  const dbUrl = "mysql://2p8ob8h7CK7Zznh.root:vNmR8q3aVoJTs6To@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test";
  
  try {
    const connection = await mysql.createConnection({
      uri: dbUrl,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("🧨 正在執行完整刪除...");
    
    // 徹底刪除資料庫並重建，這是最乾淨的方法
    await connection.query('DROP DATABASE IF EXISTS test;');
    await connection.query('CREATE DATABASE test;');
    await connection.query('USE test;');
    
    console.log("✨ 資料庫已徹底清空並重建！");
    await connection.end();
  } catch (error) {
    console.error("❌ 重置失敗：", error);
  }
}
fullReset();