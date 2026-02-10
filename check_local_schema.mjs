import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function checkSchema() {
  const conn = await pool.getConnection();
  
  try {
    console.log('\n=== 本地 TiDB room_types 表結構 ===\n');
    const [columns] = await conn.query('DESCRIBE room_types');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} ${col.Type.padEnd(30)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n=== 本地 TiDB home_config 表結構 ===\n');
    const [homeConfigCols] = await conn.query('DESCRIBE home_config');
    homeConfigCols.forEach(col => {
      console.log(`${col.Field.padEnd(25)} ${col.Type.padEnd(30)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } finally {
    await conn.release();
    await pool.end();
  }
}

checkSchema().catch(console.error);
