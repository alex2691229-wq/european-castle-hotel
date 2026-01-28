import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function generateAlterSQL() {
  const conn = await pool.getConnection();
  
  try {
    // 查詢本地 TiDB 的 room_types 表結構
    const [roomTypesColumns] = await conn.query('DESCRIBE room_types');
    
    console.log('\n=== 需要添加到 Vercel TiDB 的 ALTER TABLE 命令 ===\n');
    
    // 生成 room_types 的 ALTER TABLE 命令
    console.log('-- room_types 表\n');
    const missingColumns = [
      'nameEn', 'descriptionEn', 'weekendPrice', 'maxSalesQuantity'
    ];
    
    for (const col of missingColumns) {
      const colInfo = roomTypesColumns.find(c => c.Field === col);
      if (colInfo) {
        let sqlType = colInfo.Type;
        let nullable = colInfo.Null === 'YES' ? '' : 'NOT NULL';
        let defaultVal = colInfo.Default ? `DEFAULT ${colInfo.Default}` : '';
        console.log(`ALTER TABLE room_types ADD COLUMN ${col} ${sqlType} ${nullable} ${defaultVal};`);
      }
    }
    
    // 查詢 home_config 表
    const [homeConfigColumns] = await conn.query('DESCRIBE home_config');
    console.log('\n-- home_config 表\n');
    const homeConfigMissing = ['carouselImages'];
    
    for (const col of homeConfigMissing) {
      const colInfo = homeConfigColumns.find(c => c.Field === col);
      if (colInfo) {
        let sqlType = colInfo.Type;
        let nullable = colInfo.Null === 'YES' ? '' : 'NOT NULL';
        let defaultVal = colInfo.Default ? `DEFAULT ${colInfo.Default}` : '';
        console.log(`ALTER TABLE home_config ADD COLUMN ${col} ${sqlType} ${nullable} ${defaultVal};`);
      }
    }
    
    // 查詢 news 表
    const [newsColumns] = await conn.query('DESCRIBE news');
    console.log('\n-- news 表\n');
    const newsMissing = ['titleEn', 'contentEn'];
    
    for (const col of newsMissing) {
      const colInfo = newsColumns.find(c => c.Field === col);
      if (colInfo) {
        let sqlType = colInfo.Type;
        let nullable = colInfo.Null === 'YES' ? '' : 'NOT NULL';
        let defaultVal = colInfo.Default ? `DEFAULT ${colInfo.Default}` : '';
        console.log(`ALTER TABLE news ADD COLUMN ${col} ${sqlType} ${nullable} ${defaultVal};`);
      }
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

generateAlterSQL().catch(console.error);
