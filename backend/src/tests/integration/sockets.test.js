import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as Client } from 'socket.io-client';
import { createApp } from '../../app.js';
import { initializeSockets } from '../../sockets/index.js';
import { RoomManager } from '../../sockets/rooms/roomManager.js';
import { ProximityEngine } from '../../proximity/proximityEngine.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { SOCKET_EVENTS } from '@proxispeak/shared';

describe('Socket.IO Room, Movement & WebRTC Signaling Integration Tests', () => {
  let server;
  let io;
  let port;
  let client1;
  let client2;
  let roomManager;
  let proximityEngine;

  beforeAll(async () => {
    await connectDatabase();
    const app = createApp();
    server = http.createServer(app);

    roomManager = new RoomManager();
    proximityEngine = new ProximityEngine({ activationRadius: 100, hysteresisBuffer: 15 });

    const socketInit = initializeSockets(server, {
      roomManager,
      proximityEngine
    });
    io = socketInit.io;

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    io.close();
    await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
  });

  it('allows client 1 to join room and receives room:state', async () => {
    client1 = Client(`http://localhost:${port}`, { transports: ['websocket'] });

    await new Promise((resolve) => client1.on('connect', resolve));

    const statePromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.ROOM_STATE, (state) => {
        resolve(state);
      });
    });

    client1.emit(SOCKET_EVENTS.ROOM_JOIN, {
      roomId: 'main-hall',
      displayName: 'Alice',
      userId: 'user_alice',
      initialPosition: { x: 500, y: 500 }
    });

    const state = await statePromise;
    expect(state).toHaveProperty('self');
    expect(state.self.displayName).toBe('Alice');
    expect(state.self.userId).toBe('user_alice');
    expect(state).toHaveProperty('layout');
    expect(state.layout.dimensions.width).toBe(1600);
  });

  it('notifies client 1 when client 2 joins the same room', async () => {
    client2 = Client(`http://localhost:${port}`, { transports: ['websocket'] });

    await new Promise((resolve) => client2.on('connect', resolve));

    const joinedNotificationPromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.USER_JOINED, (user) => {
        resolve(user);
      });
    });

    client2.emit(SOCKET_EVENTS.ROOM_JOIN, {
      roomId: 'main-hall',
      displayName: 'Bob',
      userId: 'user_bob',
      // Spawn Bob far away at (800, 800) so initial distance is > 100px
      initialPosition: { x: 800, y: 800 }
    });

    const joinedUser = await joinedNotificationPromise;
    expect(joinedUser.displayName).toBe('Bob');
    expect(joinedUser.userId).toBe('user_bob');
  });

  it('synchronizes movement between users in the same room', async () => {
    const movementPromise = new Promise((resolve) => {
      client2.on(SOCKET_EVENTS.USER_MOVED, (payload) => {
        resolve(payload);
      });
    });

    client1.emit(SOCKET_EVENTS.USER_MOVE, {
      x: 520,
      y: 500,
      facing: 'right'
    });

    const movePayload = await movementPromise;
    expect(movePayload.userId).toBe('user_alice');
    expect(movePayload.x).toBe(520);
    expect(movePayload.y).toBe(500);
  });

  it('triggers WebRTC proximity activation when users walk into 100px range', async () => {
    // Alice is at (520, 500). Move Bob to (580, 500) -> distance is 60px (< 100px)
    const client1ProximityPromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.PROXIMITY_UPDATE, (update) => {
        if (update.inRange) resolve(update);
      });
    });

    const client2ProximityPromise = new Promise((resolve) => {
      client2.on(SOCKET_EVENTS.PROXIMITY_UPDATE, (update) => {
        if (update.inRange) resolve(update);
      });
    });

    client2.emit(SOCKET_EVENTS.USER_MOVE, {
      x: 580,
      y: 500,
      facing: 'left'
    });

    const [p1, p2] = await Promise.all([client1ProximityPromise, client2ProximityPromise]);
    expect(p1.inRange).toBe(true);
    expect(p1.peerId).toBe('user_bob');
    expect(p1.distance).toBe(60);

    expect(p2.inRange).toBe(true);
    expect(p2.peerId).toBe('user_alice');
    expect(p2.distance).toBe(60);

    // Polite negotiation check: one is polite, one is impolite
    expect(p1.isPolite !== p2.isPolite).toBe(true);
  });

  it('relays authorized WebRTC offer and answer between proximate peers', async () => {
    const offerPromise = new Promise((resolve) => {
      client2.on(SOCKET_EVENTS.WEBRTC_OFFER, (msg) => {
        resolve(msg);
      });
    });

    client1.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
      targetUserId: 'user_bob',
      sdp: { type: 'offer', sdp: 'v=0\r\no=alice 12345 12345 IN IP4 127.0.0.1' }
    });

    const offer = await offerPromise;
    expect(offer.senderUserId).toBe('user_alice');
    expect(offer.sdp.type).toBe('offer');

    // Bob sends answer back to Alice
    const answerPromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.WEBRTC_ANSWER, (msg) => {
        resolve(msg);
      });
    });

    client2.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
      targetUserId: 'user_alice',
      sdp: { type: 'answer', sdp: 'v=0\r\no=bob 67890 67890 IN IP4 127.0.0.1' }
    });

    const answer = await answerPromise;
    expect(answer.senderUserId).toBe('user_bob');
    expect(answer.sdp.type).toBe('answer');
  });

  it('triggers proximity EXIT when users move apart beyond hysteresis threshold (> 115px)', async () => {
    const client1ExitPromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.PROXIMITY_UPDATE, (update) => {
        if (!update.inRange) resolve(update);
      });
    });

    // Move Bob to (700, 500) -> distance from Alice (520) is 180px (> 115px)
    client2.emit(SOCKET_EVENTS.USER_MOVE, {
      x: 700,
      y: 500,
      facing: 'right'
    });

    const exitUpdate = await client1ExitPromise;
    expect(exitUpdate.inRange).toBe(false);
    expect(exitUpdate.peerId).toBe('user_bob');
  });

  it('rejects WebRTC signaling when users are outside proximity range', async () => {
    const errorPromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.ERROR_MESSAGE, (err) => {
        resolve(err);
      });
    });

    // Attempt to signal Bob now that users are out of range
    client1.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
      targetUserId: 'user_bob',
      sdp: { type: 'offer', sdp: 'v=0\r\no=alice 12345' }
    });

    const error = await errorPromise;
    expect(error.error).toBe('PROXIMITY_NOT_ESTABLISHED');
  });

  it('cleans up session and broadcasts user:left on disconnect', async () => {
    const leftPromise = new Promise((resolve) => {
      client1.on(SOCKET_EVENTS.USER_LEFT, (msg) => {
        resolve(msg);
      });
    });

    client2.disconnect();

    const leftMsg = await leftPromise;
    expect(leftMsg.userId).toBe('user_bob');
  });
});
