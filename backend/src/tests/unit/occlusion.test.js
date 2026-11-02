import { describe, it, expect } from 'vitest';
import { calculateOcclusion } from '../../audio/occlusionEngine.js';

describe('Sound Occlusion Engine', () => {
  const furniture = [
    {
      id: 'acoustic_wall',
      type: 'acoustic_partition',
      x: 300,
      y: 100,
      width: 20,
      height: 200,
      isSolid: true,
      isAcousticObstacle: true
    },
    {
      id: 'coffee_table',
      type: 'coffee_table',
      x: 500,
      y: 500,
      width: 80,
      height: 40,
      isSolid: true,
      isAcousticObstacle: false // Regular furniture does not block sound
    }
  ];

  it('reports full direct line-of-sight audio when unobstructed', () => {
    // Both users south of partition
    const result = calculateOcclusion(200, 400, 400, 400, furniture);
    expect(result.isOccluded).toBe(false);
    expect(result.attenuationFactor).toBe(1.0);
    expect(result.obstacle).toBeNull();
  });

  it('detects acoustic occlusion when acoustic partition blocks direct line-of-sight', () => {
    // Listener at (250, 200), speaker at (350, 200) - line crosses acoustic wall at x=300..320
    const result = calculateOcclusion(250, 200, 350, 200, furniture);
    expect(result.isOccluded).toBe(true);
    expect(result.attenuationFactor).toBe(0.25);
    expect(result.obstacle.id).toBe('acoustic_wall');
  });

  it('ignores furniture not marked as acoustic obstacles', () => {
    // Listener at (450, 520), speaker at (620, 520) - line crosses coffee table
    const result = calculateOcclusion(450, 520, 620, 520, furniture);
    expect(result.isOccluded).toBe(false);
    expect(result.attenuationFactor).toBe(1.0);
  });
});

