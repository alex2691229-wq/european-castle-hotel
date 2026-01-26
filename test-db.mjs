import { getAllRoomTypes } from './server/db.ts';

async function test() {
  try {
    const rooms = await getAllRoomTypes();
    console.log('✅ getAllRoomTypes() returned:', rooms.length, 'rooms');
    if (rooms.length > 0) {
      console.log('First room:', rooms[0].name);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

test();
