import mysql from 'mysql2/promise';

const databaseUrl = 'mysql://2p8ob8h7CK7Zznh.root:y4sK02wAdqgjyWMq@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test';

console.log('Creating missing tables...');

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

  // 創建 room_types 表
  const createRoomTypes = `
    CREATE TABLE IF NOT EXISTS room_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      nameEn VARCHAR(100),
      description TEXT NOT NULL,
      descriptionEn TEXT,
      size VARCHAR(50),
      capacity INT NOT NULL DEFAULT 2,
      price DECIMAL(10,2) NOT NULL,
      weekendPrice DECIMAL(10,2),
      images TEXT,
      amenities TEXT,
      isAvailable BOOLEAN NOT NULL DEFAULT true,
      displayOrder INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  await connection.query(createRoomTypes);
  console.log('✓ room_types table created');

  // 創建 bookings 表
  const createBookings = `
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      roomTypeId INT NOT NULL,
      guestName VARCHAR(100) NOT NULL,
      guestEmail VARCHAR(320) NOT NULL,
      guestPhone VARCHAR(20),
      checkInDate DATE NOT NULL,
      checkOutDate DATE NOT NULL,
      numberOfGuests INT NOT NULL,
      numberOfRooms INT NOT NULL DEFAULT 1,
      totalPrice DECIMAL(10,2) NOT NULL,
      status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  await connection.query(createBookings);
  console.log('✓ bookings table created');

  console.log('✓ All tables created successfully');
  await connection.end();
} catch (error) {
  console.error('✗ Failed:', error.message);
  process.exit(1);
}
