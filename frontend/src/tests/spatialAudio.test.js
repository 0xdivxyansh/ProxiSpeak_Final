import { describe, it, expect } from 'vitest';
import {
  calculateDistanceGain,
  calculateStereoPan,
  calculateOcclusion
} from '../services/audio/spatialAudioEngine.js';

describe('Spatial Audio Attenuation & Stereo Panning Mathematics', () => {
  it('returns maximum gain 1.0 at zero or near-zero distance', () => {
    expect(calculateDistanceGain(0, 100)).toBe(1.0);
    expect(calculateDistanceGain(0.5, 100)).toBeCloseTo(0.99, 1);
  });

  it('calculates expected gain for close users (e.g. 20px distance)', () => {
    const gain = calculateDistanceGain(20, 100);
    expect(gain).toBeGreaterThan(0.7);
    expect(gain).toBeLessThan(1.0);
  });

  it('calculates expected gain for intermediate distance (e.g. 50px distance)', () => {
    const gain = calculateDistanceGain(50, 100);
    expect(gain).toBeGreaterThan(0.35);
    expect(gain).toBeLessThan(0.55);
  });

  it('calculates faint audible gain just inside 100px radius (e.g. 95px distance)', () => {
    const gain = calculateDistanceGain(95, 100);
    expect(gain).toBeGreaterThan(0.0);
    expect(gain).toBeLessThan(0.1);
  });

  it('returns 0.0 gain exactly at 100px boundary', () => {
    expect(calculateDistanceGain(100, 100)).toBe(0.0);
  });

  it('returns 0.0 gain outside 100px radius (e.g. 150px)', () => {
    expect(calculateDistanceGain(150, 100)).toBe(0.0);
  });

  it('clamps gain values strictly between 0.0 and 1.0', () => {
    expect(calculateDistanceGain(-50, 100)).toBe(1.0);
    expect(calculateDistanceGain(500, 100)).toBe(0.0);
  });

  it('calculates stereo panning correctly for left and right relative positions', () => {
    // Listener at 500, speaker at 500 -> center (0.0)
    expect(calculateStereoPan(500, 500, 100)).toBe(0.0);

    // Listener at 500, speaker at 450 (50px to the left) -> negative pan (-0.5)
    expect(calculateStereoPan(500, 450, 100)).toBe(-0.5);

    // Listener at 500, speaker at 550 (50px to the right) -> positive pan (+0.5)
    expect(calculateStereoPan(500, 550, 100)).toBe(0.5);
  });

  it('clamps stereo pan to [-0.95, +0.95] to prevent total ear isolation', () => {
    // Very far right
    expect(calculateStereoPan(200, 800, 100)).toBe(0.95);
    // Very far left
    expect(calculateStereoPan(800, 200, 100)).toBe(-0.95);
  });

  it('calculates sound occlusion attenuation when acoustic obstacles intersect audio line-of-sight', () => {
    const furniture = [
      { id: 'baffle', isAcousticObstacle: true, x: 100, y: 100, width: 20, height: 100 }
    ];

    const occluded = calculateOcclusion(50, 150, 150, 150, furniture);
    expect(occluded.isOccluded).toBe(true);
    expect(occluded.attenuationFactor).toBe(0.25);

    const clear = calculateOcclusion(50, 50, 150, 50, furniture);
    expect(clear.isOccluded).toBe(false);
    expect(clear.attenuationFactor).toBe(1.0);
  });
});
