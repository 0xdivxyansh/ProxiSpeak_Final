import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { UserSession } from '../../models/UserSession.js';
import * as sessionRepo from '../../repositories/sessionRepository.js';

describe('Real MongoDB 2dsphere Geospatial Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    // Ensure indexes including 2dsphere
    await UserSession.syncIndexes();
  });

  afterAll(async () => {
    await sessionRepo.clearAllSessions();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await sessionRepo.clearAllSessions();
  });

  it('verifies 2dsphere index is present on UserSession location', async () => {
    const indexes = await UserSession.collection.indexes();
    const sphereIndex = indexes.find((idx) => idx.key && idx.key.location === '2dsphere');
    expect(sphereIndex).toBeDefined();
    expect(sphereIndex.key.roomId).toBe(1);
  });

  it('executes native $near query and retrieves users within 100px proximity radius', async () => {
    // User 1 (Alice) at (500, 500)
    await sessionRepo.upsertSession({
      userId: 'user_alice',
      socketId: 'sock_alice',
      roomId: 'main-hall',
      displayName: 'Alice',
      color: '#38bdf8',
      x: 500,
      y: 500
    });

    // User 2 (Bob) at (560, 500) -> 60px away (well within 100px radius)
    await sessionRepo.upsertSession({
      userId: 'user_bob',
      socketId: 'sock_bob',
      roomId: 'main-hall',
      displayName: 'Bob',
      color: '#34d399',
      x: 560,
      y: 500
    });

    // User 3 (Charlie) at (800, 500) -> 300px away (outside 100px radius)
    await sessionRepo.upsertSession({
      userId: 'user_charlie',
      socketId: 'sock_charlie',
      roomId: 'main-hall',
      displayName: 'Charlie',
      color: '#fbbf24',
      x: 800,
      y: 500
    });

    // Execute native $near query from Alice's position with radius = 100px, excluding Alice herself
    const nearby = await sessionRepo.findNearbyUsersWithNear(
      'main-hall',
      500,
      500,
      100,
      'user_alice'
    );

    expect(nearby).toHaveLength(1);
    expect(nearby[0].userId).toBe('user_bob');
    expect(nearby[0].displayName).toBe('Bob');
  });

  it('guarantees room isolation in geospatial queries (room B users excluded from room A)', async () => {
    // Alice in 'main-hall' at (500, 500)
    await sessionRepo.upsertSession({
      userId: 'user_alice',
      socketId: 'sock_alice',
      roomId: 'main-hall',
      displayName: 'Alice',
      x: 500,
      y: 500
    });

    // Eve in 'private-lounge' at (505, 500) - only 5px away, but in a different room!
    await sessionRepo.upsertSession({
      userId: 'user_eve',
      socketId: 'sock_eve',
      roomId: 'private-lounge',
      displayName: 'Eve',
      x: 505,
      y: 500
    });

    const nearbyInMainHall = await sessionRepo.findNearbyUsersWithNear(
      'main-hall',
      500,
      500,
      100,
      'user_alice'
    );

    expect(nearbyInMainHall).toHaveLength(0); // Eve must NOT be returned!
  });

  it('executes native $geoWithin query to find users inside a bounding region', async () => {
    // Spawn 3 users
    await sessionRepo.upsertSession({
      userId: 'u1',
      socketId: 's1',
      roomId: 'main-hall',
      displayName: 'Inside 1',
      x: 200,
      y: 200
    });

    await sessionRepo.upsertSession({
      userId: 'u2',
      socketId: 's2',
      roomId: 'main-hall',
      displayName: 'Inside 2',
      x: 350,
      y: 350
    });

    await sessionRepo.upsertSession({
      userId: 'u3',
      socketId: 's3',
      roomId: 'main-hall',
      displayName: 'Outside',
      x: 800,
      y: 800
    });

    // Query region [100, 100] to [400, 400]
    const inRegion = await sessionRepo.findUsersInRegionWithGeoWithin(
      'main-hall',
      100,
      100,
      400,
      400
    );

    expect(inRegion).toHaveLength(2);
    const ids = inRegion.map((u) => u.userId);
    expect(ids).toContain('u1');
    expect(ids).toContain('u2');
    expect(ids).not.toContain('u3');
  });

  it('reflects updated proximity results after moving a user', async () => {
    await sessionRepo.upsertSession({
      userId: 'alice',
      socketId: 's_a',
      roomId: 'main-hall',
      displayName: 'Alice',
      x: 300,
      y: 300
    });

    await sessionRepo.upsertSession({
      userId: 'bob',
      socketId: 's_b',
      roomId: 'main-hall',
      displayName: 'Bob',
      x: 600,
      y: 300 // 300px away: initially out of range
    });

    let nearby = await sessionRepo.findNearbyUsersWithNear('main-hall', 300, 300, 100, 'alice');
    expect(nearby).toHaveLength(0);

    // Move Bob to (350, 300) - now 50px away
    await sessionRepo.upsertSession({
      userId: 'bob',
      socketId: 's_b',
      roomId: 'main-hall',
      displayName: 'Bob',
      x: 350,
      y: 300
    });

    nearby = await sessionRepo.findNearbyUsersWithNear('main-hall', 300, 300, 100, 'alice');
    expect(nearby).toHaveLength(1);
    expect(nearby[0].userId).toBe('bob');
  });
});

