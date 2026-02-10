import mysql from 'mysql2/promise.js';

const dbUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(dbUrl);

async function checkDisplayOrder() {
  const conn = await pool.getConnection();
  
  try {
    const tables = ['room_types', 'facilities', 'featured_services', 'room_availability'];
    
    for (const table of tables) {
      try {
        const [columns] = await conn.query(`DESCRIBE ${table}`);
        const displayOrderCol = columns.find(col => col.Field.toLowerCase().includes('display'));
        if (displayOrderCol) {
          console.log(`${table}: ${displayOrderCol.Field}`);
        }
      } catch (error) {
        // ignore
      }
    }

  } finally {
    await conn.release();
    await pool.end();
  }
}

checkDisplayOrder().catch(console.error);
