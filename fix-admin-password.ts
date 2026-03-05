import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function fix() {
  const dbUrl = "mysql://2p8ob8h7CK7Zznh.root:vNmR8q3aVoJTs6To@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test";
  const connection = await mysql.createConnection({ uri: dbUrl, ssl: { rejectUnauthorized: true } });
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("123456", salt);
  
  console.log("🛠️ 正在更新 Admin 密碼為正確的 Bcrypt 格式...");
  await connection.query(
    "UPDATE users SET passwordHash = ? WHERE username = 'admin'",
    [hash]
  );
  
  console.log("✅ 更新成功！現在可以用 admin / 123456 登入了。");
  await connection.end();
}
fix();