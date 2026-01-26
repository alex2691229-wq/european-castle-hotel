import * as db from './api/db.ts';
const rooms = await db.getAllRoomTypes();
console.log('Rooms:', rooms.length);
if (rooms.length > 0) {
  console.log('First room:', rooms[0]);
}
