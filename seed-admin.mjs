import mysql from 'mysql2/promise';
import crypto from 'crypto';

const databaseUrl = 'mysql://2p8ob8h7CK7Zznh.root:y4sK02wAdqgjyWMq@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test';

console.log('Adding initial admin user...');

try {
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };

  const connection = await mysql.createConnection(config);
  console.log('✓ Connected to database');

  // 檢查是否已存在 admin 帳號
  const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
  
  if (existing.length > 0) {
    console.log('✓ Admin user already exists');
  } else {
    // 創建密碼雜湊
    const password = '123456';
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // 插入管理員帳號
    await connection.query(
      'INSERT INTO users (openId, username, passwordHash, name, email, loginMethod, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['admin', 'admin', passwordHash, 'Admin', 'admin@hotel.local', 'username', 'admin', 'active']
    );
    console.log('✓ Admin user created: admin / 123456');
  }

  // 檢查是否已存在房型
  const [rooms] = await connection.query('SELECT id FROM room_types');
  
  if (rooms.length === 0) {
    // 添加初始房型
    const roomTypes = [
      {
        name: '豪華雙人房',
        nameEn: 'Luxury Double Room',
        description: '寬敞舒適的豪華雙人房，配備高級設施',
        descriptionEn: 'Spacious and comfortable luxury double room with premium facilities',
        size: '35m²',
        capacity: 2,
        price: 3500,
        weekendPrice: 4500,
      },
      {
        name: '精緻套房',
        nameEn: 'Deluxe Suite',
        description: '獨立客廳和臥室的精緻套房',
        descriptionEn: 'Deluxe suite with separate living room and bedroom',
        size: '50m²',
        capacity: 2,
        price: 5000,
        weekendPrice: 6500,
      },
      {
        name: '標準雙人房',
        nameEn: 'Standard Double Room',
        description: '舒適的標準雙人房，適合商務旅客',
        descriptionEn: 'Comfortable standard double room suitable for business travelers',
        size: '25m²',
        capacity: 2,
        price: 2500,
        weekendPrice: 3500,
      },
    ];

    for (const room of roomTypes) {
      await connection.query(
        'INSERT INTO room_types (name, nameEn, description, descriptionEn, size, capacity, price, weekendPrice, isAvailable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [room.name, room.nameEn, room.description, room.descriptionEn, room.size, room.capacity, room.price, room.weekendPrice, true]
      );
    }
    console.log('✓ Initial room types created');
  } else {
    console.log(`✓ Room types already exist (${rooms.length} rooms)`);
  }

  console.log('✓ Database seeding completed');
  await connection.end();
} catch (error) {
  console.error('✗ Seeding failed:', error.message);
  process.exit(1);
}
