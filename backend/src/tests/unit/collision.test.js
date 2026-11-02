import { describe, it, expect } from 'vitest';
import { checkAvatarCollision } from '../../geospatial/collisionEngine.js';

describe('Collision Engine', () => {
  const testFurniture = [
    {
      id: 'desk_1',
      type: 'desk',
      x: 300,
      y: 300,
      width: 100,
      height: 60,
      isSolid: true
    },
    {
      id: 'decor_plant',
      type: 'plant',
      x: 600,
      y: 600,
      width: 30,
      height: 30,
      isSolid: false // Non-solid
    }
  ];

  it('permits movement in empty workspace space', () => {
    const result = checkAvatarCollision(500, 500, testFurniture);
    expect(result.collides).toBe(false);
    expect(result.obstacle).toBeNull();
  });

  it('detects collisions with solid desk', () => {
    // Avatar center (310, 310) is inside desk (300..400, 300..360)
    const result = checkAvatarCollision(310, 310, testFurniture);
    expect(result.collides).toBe(true);
    expect(result.obstacle.id).toBe('desk_1');
    expect(result.reason).toBe('OBSTACLE_COLLISION');
  });

  it('detects collision when avatar circle overlaps desk edge', () => {
    // Avatar center (290, 330) with radius 18 reaches x=308, which overlaps x=300
    const result = checkAvatarCollision(290, 330, testFurniture, 18);
    expect(result.collides).toBe(true);
    expect(result.obstacle.id).toBe('desk_1');
  });

  it('ignores non-solid furniture items', () => {
    // Avatar right on top of decor plant
    const result = checkAvatarCollision(610, 610, testFurniture);
    expect(result.collides).toBe(false);
  });

  it('prevents avatar from leaving workspace perimeter bounds', () => {
    // Left boundary
    expect(checkAvatarCollision(5, 500, [], 18).collides).toBe(true);
    expect(checkAvatarCollision(5, 500, [], 18).reason).toBe('OUT_OF_BOUNDS');

    // Right boundary (workspace width 1600)
    expect(checkAvatarCollision(1595, 500, [], 18).collides).toBe(true);

    // Top boundary
    expect(checkAvatarCollision(500, 10, [], 18).collides).toBe(true);

    // Bottom boundary (workspace height 1000)
    expect(checkAvatarCollision(500, 995, [], 18).collides).toBe(true);
  });
});

