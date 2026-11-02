import { describe, it, expect } from 'vitest';
import { validateMovement } from '../../geospatial/movementValidator.js';

describe('Movement Validator', () => {
  const currentSession = {
    x: 400,
    y: 400,
    lastActiveTimestamp: 1000000
  };

  const obstacles = [
    { id: 'wall_1', type: 'wall', x: 450, y: 350, width: 20, height: 100, isSolid: true }
  ];

  it('allows valid normal speed movement', () => {
    const move = {
      x: 405,
      y: 402,
      facing: 'right',
      timestamp: 1000050 // 50ms later
    };

    const result = validateMovement(currentSession, move, obstacles);
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid non-finite coordinates', () => {
    const move = { x: NaN, y: 400, timestamp: 1000050 };
    const result = validateMovement(currentSession, move, obstacles);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('INVALID_COORDINATES');
    expect(result.correctedPosition).toEqual({ x: 400, y: 400 });
  });

  it('rejects impossible teleportation speeds', () => {
    // 800px leap in 16ms (~50,000 pixels/sec)
    const move = {
      x: 1200,
      y: 400,
      timestamp: 1000016
    };

    const result = validateMovement(currentSession, move, obstacles);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('EXCESSIVE_VELOCITY');
    expect(result.correctedPosition).toEqual({ x: 400, y: 400 });
  });

  it('rejects movement into solid obstacle', () => {
    // Wall is at 450..470, 350..450
    const move = {
      x: 455,
      y: 380,
      timestamp: 1001000
    };

    const result = validateMovement(currentSession, move, obstacles);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('OBSTACLE_COLLISION');
    expect(result.correctedPosition).toEqual({ x: 400, y: 400 });
  });
});

