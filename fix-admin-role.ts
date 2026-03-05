import mysql from 'mysql2/promise';

async function fix() {
  const dbUrl = "mysql://2p8ob8h7CK7Zznh.root:vNmR8q3aVoJTs6To@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test";
  const connection = await mysql.createConnection({ uri: dbUrl, ssl: { rejectUnauthorized: true } });
  
  console.log("🛠️ 正在提升 admin 權限至 'admin'...");
  await connection.query(
    "UPDATE users SET role = 'admin' WHERE username = 'admin'"
  );
  
  console.log("✅ 權限更新成功！");
  await connection.end();
}
fix();