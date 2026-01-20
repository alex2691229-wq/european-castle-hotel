// 簡化的數據庫連線 - 使用 mysql2/promise 直接連線
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getDbPool() {
  if (!pool) {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // 解析連線字符串
      // mysql://username:password@host:port/database?ssl=true
      const url = new URL(databaseUrl);
      const config = {
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('ssl') === 'true' ? 'amazon' : false,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      };

      console.log('[Database] Creating connection pool...');
      console.log('[Database] Host:', config.host);
      console.log('[Database] Port:', config.port);
      console.log('[Database] Database:', config.database);
      console.log('[Database] SSL:', config.ssl);

      pool = mysql.createPool(config);
      
      // 測試連線
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('[Database] Connection pool created successfully');
    } catch (error) {
      console.error('[Database] Failed to create connection pool:', error);
      pool = null;
      throw error;
    }
  }
  return pool;
}

export async function query(sql: string, values?: any[]) {
  const pool = await getDbPool();
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

export async function execute(sql: string, values?: any[]) {
  const pool = await getDbPool();
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    connection.release();
  }
}
