import { describe, it, expect, beforeEach } from 'vitest';
import { ProximityEngine } from '../../proximity/proximityEngine.js';

describe('Proximity Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new ProximityEngine({ activationRadius: 100, hysteresisBuffer: 15 });
  });

  it('triggers ENTER event when users are at the exact same position (0 distance)', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 's2', roomId: 'r1', x: 200, y: 200 };

    const events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ENTER');
    expect(events[0].distance).toBe(0);
    expect(events[0].inRange).toBe(true);
    expect(engine.isSignalingAuthorized('u1', 'u2')).toBe(true);
  });

  it('triggers ENTER event when users are just inside the 100px radius (e.g. 99px)', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 's2', roomId: 'r1', x: 299, y: 200 };

    const events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ENTER');
    expect(events[0].distance).toBe(99);
    expect(events[0].inRange).toBe(true);
    expect(engine.isPairActive('u1', 'u2')).toBe(true);
  });

  it('triggers ENTER event when users are exactly at the 100px radius boundary', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 's2', roomId: 'r1', x: 300, y: 200 };

    const events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ENTER');
    expect(events[0].distance).toBe(100);
    expect(events[0].inRange).toBe(true);
  });

  it('does NOT trigger ENTER when users are just outside the 100px radius (e.g. 101px)', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 's2', roomId: 'r1', x: 301, y: 200 };

    const events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events).toHaveLength(0);
    expect(engine.isPairActive('u1', 'u2')).toBe(false);
    expect(engine.isSignalingAuthorized('u1', 'u2')).toBe(false);
  });

  it('handles hysteresis correctly: stays connected between 100px and 115px', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 's2', roomId: 'r1', x: 250, y: 200 }; // 50px -> connects

    let events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events[0].type).toBe('ENTER');
    expect(engine.isPairActive('u1', 'u2')).toBe(true);

    // Moves to 105px (outside 100px, but inside 100 + 15 = 115px buffer)
    userA.x = 145;
    events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events[0].type).toBe('DISTANCE_UPDATE');
    expect(events[0].distance).toBe(105);
    expect(engine.isPairActive('u1', 'u2')).toBe(true); // Still connected!

    // Moves to 116px (outside 115px exit threshold)
    userA.x = 134; // 250 - 134 = 116
    events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events[0].type).toBe('EXIT');
    expect(events[0].distance).toBe(116);
    expect(events[0].inRange).toBe(false);
    expect(engine.isPairActive('u1', 'u2')).toBe(false); // Disconnected!
  });

  it('never connects a user to themselves', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const events = engine.evaluateUserMovement(userA, [userA]);
    expect(events).toHaveLength(0);
    expect(engine.isSignalingAuthorized('u1', 'u1')).toBe(false);
  });

  it('deduplicates peer pairs and assigns polite peer deterministically', () => {
    const userA = { userId: 'u1', socketId: 'socket_alpha', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 'socket_beta', roomId: 'r1', x: 250, y: 200 };

    const events = engine.evaluateUserMovement(userA, [userA, userB]);
    expect(events).toHaveLength(1);
    // 'socket_alpha' < 'socket_beta' -> userA is polite
    expect(events[0].isPoliteForA).toBe(true);
    expect(events[0].isPoliteForB).toBe(false);
  });

  it('handles user disconnect and tears down active proximity relationships', () => {
    const userA = { userId: 'u1', socketId: 's1', roomId: 'r1', x: 200, y: 200 };
    const userB = { userId: 'u2', socketId: 's2', roomId: 'r1', x: 250, y: 200 };

    engine.evaluateUserMovement(userA, [userA, userB]);
    expect(engine.isPairActive('u1', 'u2')).toBe(true);

    const teardownEvents = engine.handleUserDisconnect('u1', [userB]);
    expect(teardownEvents).toHaveLength(1);
    expect(teardownEvents[0].type).toBe('EXIT');
    expect(teardownEvents[0].disconnectedUserId).toBe('u1');
    expect(engine.isPairActive('u1', 'u2')).toBe(false);
  });

  it('handles high user density efficiently', () => {
    const movingUser = { userId: 'u_center', socketId: 's_center', roomId: 'r1', x: 500, y: 500 };
    const densePeers = [];

    // Create 50 users clustered within 50px radius
    for (let i = 0; i < 50; i++) {
      densePeers.push({
        userId: `peer_${i}`,
        socketId: `socket_${i}`,
        roomId: 'r1',
        x: 500 + (Math.random() - 0.5) * 50,
        y: 500 + (Math.random() - 0.5) * 50
      });
    }

    const t0 = performance.now();
    const transitions = engine.evaluateUserMovement(movingUser, [movingUser, ...densePeers]);
    const t1 = performance.now();

    expect(transitions).toHaveLength(50);
    // Latency should be sub-millisecond for 50 peers
    expect(t1 - t0).toBeLessThan(10);
  });
});

