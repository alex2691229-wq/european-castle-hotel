import { getDb } from './server/db.ts';
import { roomTypes } from './drizzle/schema.ts';

const db = await getDb();
if (!db) {
  console.log('Database not available');
  process.exit(1);
}

const result = await db.select().from(roomTypes);
console.log('Room types count:', result.length);
console.log('Room types:', result);
