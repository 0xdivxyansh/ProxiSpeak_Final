import { describe, it, expect } from 'vitest';
import {
  createRoomSchema,
  joinRoomSchema,
  movementPayloadSchema,
  webrtcOfferSchema
} from '../../validation/schemas.js';

describe('Zod Validation Schemas', () => {
  it('validates valid create room requests', () => {
    const valid = {
      roomId: 'engineering-room',
      name: 'Engineering Team Office',
      maxCapacity: 25
    };
    const parsed = createRoomSchema.parse(valid);
    expect(parsed.roomId).toBe('engineering-room');
    expect(parsed.layoutId).toBe('default-office-layout');
  });

  it('rejects invalid room IDs with special characters or spaces', () => {
    expect(() =>
      createRoomSchema.parse({
        roomId: 'invalid room!@#',
        name: 'Invalid'
      })
    ).toThrow();
  });

  it('validates join room payloads', () => {
    const valid = {
      roomId: 'main-hall',
      displayName: 'Alice Engineer',
      preferredColor: '#38bdf8'
    };
    const parsed = joinRoomSchema.parse(valid);
    expect(parsed.displayName).toBe('Alice Engineer');
  });

  it('validates movement payloads', () => {
    const valid = { x: 350.5, y: 420.2, facing: 'left', timestamp: Date.now() };
    const parsed = movementPayloadSchema.parse(valid);
    expect(parsed.x).toBe(350.5);
    expect(parsed.facing).toBe('left');
  });

  it('rejects oversized SDP payloads for WebRTC security', () => {
    const hugeSDP = 'a'.repeat(70000);
    expect(() =>
      webrtcOfferSchema.parse({
        targetUserId: 'target_1',
        sdp: { type: 'offer', sdp: hugeSDP }
      })
    ).toThrow();
  });
});

