import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import RedisMock from 'ioredis-mock';
import { createAdapter } from '@socket.io/redis-adapter';
import { SOCKET_EVENTS } from '@proxispeak/shared';

describe('Multi-Instance Scaling with Redis Adapter', () => {
  let http1, http2;
  let io1, io2;
  let port1, port2;

  let pub1, sub1, pub2, sub2;
  let clientInstance1, clientInstance2, clientOtherRoom;

  beforeAll(async () => {
    // 1. Setup shared mock Redis cluster
    pub1 = new RedisMock();
    sub1 = pub1.duplicate();
    pub2 = pub1.duplicate();
    sub2 = pub1.duplicate();

    // 2. Setup Instance 1 (Server 1)
    http1 = http.createServer();
    io1 = new Server(http1, { cors: { origin: '*' } });
    io1.adapter(createAdapter(pub1, sub1));

    io1.on('connection', (socket) => {
      socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload) => {
        socket.join(payload.roomId);
      });
      socket.on(SOCKET_EVENTS.USER_MOVE, (payload) => {
        // Broadcast to room via Redis adapter across instances
        socket.to(payload.roomId).emit(SOCKET_EVENTS.USER_MOVED, payload);
      });
    });

    await new Promise((resolve) =>
      http1.listen(0, () => {
        port1 = http1.address().port;
        resolve();
      })
    );

    // 3. Setup Instance 2 (Server 2)
    http2 = http.createServer();
    io2 = new Server(http2, { cors: { origin: '*' } });
    io2.adapter(createAdapter(pub2, sub2));

    io2.on('connection', (socket) => {
      socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload) => {
        socket.join(payload.roomId);
      });
      socket.on(SOCKET_EVENTS.USER_MOVE, (payload) => {
        socket.to(payload.roomId).emit(SOCKET_EVENTS.USER_MOVED, payload);
      });
    });

    await new Promise((resolve) =>
      http2.listen(0, () => {
        port2 = http2.address().port;
        resolve();
      })
    );
  });

  afterAll(async () => {
    if (clientInstance1?.connected) clientInstance1.disconnect();
    if (clientInstance2?.connected) clientInstance2.disconnect();
    if (clientOtherRoom?.connected) clientOtherRoom.disconnect();

    io1.close();
    io2.close();

    await new Promise((resolve) => http1.close(resolve));
    await new Promise((resolve) => http2.close(resolve));
  });

  it('delivers Socket.IO events across two separate server instances connected to Redis', async () => {
    // Client 1 connects to Server Instance 1
    clientInstance1 = Client(`http://localhost:${port1}`, { transports: ['websocket'] });
    await new Promise((resolve) => clientInstance1.on('connect', resolve));
    clientInstance1.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId: 'scale-room-1' });

    // Client 2 connects to Server Instance 2
    clientInstance2 = Client(`http://localhost:${port2}`, { transports: ['websocket'] });
    await new Promise((resolve) => clientInstance2.on('connect', resolve));
    clientInstance2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId: 'scale-room-1' });

    // Client 3 connects to Server Instance 2, but in 'different-room'
    clientOtherRoom = Client(`http://localhost:${port2}`, { transports: ['websocket'] });
    await new Promise((resolve) => clientOtherRoom.on('connect', resolve));
    clientOtherRoom.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId: 'different-room' });

    // Wait a brief moment for room joins to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Listen on Client 2 (connected to Instance 2) for move broadcast originated on Instance 1
    const crossInstancePromise = new Promise((resolve) => {
      clientInstance2.on(SOCKET_EVENTS.USER_MOVED, (msg) => {
        resolve(msg);
      });
    });

    // Client in different room should NOT receive this event
    let otherRoomReceived = false;
    clientOtherRoom.on(SOCKET_EVENTS.USER_MOVED, () => {
      otherRoomReceived = true;
    });

    // Client 1 on Instance 1 emits movement
    clientInstance1.emit(SOCKET_EVENTS.USER_MOVE, {
      roomId: 'scale-room-1',
      userId: 'user_instance_1',
      x: 650,
      y: 420
    });

    const receivedPayload = await crossInstancePromise;
    expect(receivedPayload).toHaveProperty('userId', 'user_instance_1');
    expect(receivedPayload).toHaveProperty('x', 650);
    expect(receivedPayload).toHaveProperty('y', 420);

    // Verify room isolation across instances
    expect(otherRoomReceived).toBe(false);
  });
});
