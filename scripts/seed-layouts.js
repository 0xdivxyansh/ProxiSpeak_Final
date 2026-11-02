/**
 * Final Proxispeak - Layout and Room Seeding Script
 */

import { connectDatabase, disconnectDatabase } from '../backend/src/config/database.js';
import { seedDefaultLayout } from '../backend/src/services/layoutService.js';
import { getAllRoomsWithStats } from '../backend/src/services/roomService.js';

async function runSeed() {
  console.log('=== Final Proxispeak Database Seeding ===\n');
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDatabase();

    console.log('[Seed] Seeding Default Office Layout...');
    const layout = await seedDefaultLayout();
    if (layout) {
      console.log(`[Seed] Successfully seeded layout: "${layout.name}" with ${layout.furniture.length} furniture items.`);
    }

    console.log('[Seed] Ensuring Default Room exists...');
    const rooms = await getAllRoomsWithStats();
    console.log(`[Seed] Active Rooms count: ${rooms.length}`);
    for (const r of rooms) {
      console.log(`  - Room: "${r.name}" (ID: ${r.roomId}, Layout: ${r.layoutId}, Capacity: ${r.maxCapacity})`);
    }

    console.log('\n[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error(`[Seed] Seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

runSeed();

