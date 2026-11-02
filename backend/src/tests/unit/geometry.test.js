import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  checkCircleAABBCollision,
  isPointInAABB,
  doLineSegmentsIntersect,
  checkSegmentIntersectsObstacle,
  pixelToGeoJSON,
  geoJSONToPixel
} from '@proxispeak/shared';

describe('Geometry Utilities', () => {
  it('calculates correct Euclidean distance', () => {
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
    expect(calculateDistance(100, 100, 100, 100)).toBe(0);
    expect(calculateDistance(50, 50, 150, 50)).toBe(100);
  });

  it('checks point inside AABB correctly', () => {
    const box = { x: 10, y: 10, width: 100, height: 50 };
    expect(isPointInAABB(50, 30, box)).toBe(true);
    expect(isPointInAABB(10, 10, box)).toBe(true);
    expect(isPointInAABB(110, 60, box)).toBe(true);
    expect(isPointInAABB(5, 30, box)).toBe(false);
    expect(isPointInAABB(50, 70, box)).toBe(false);
  });

  it('detects circle to AABB collision', () => {
    const box = { x: 100, y: 100, width: 50, height: 50 };
    // Circle center (90, 125) with radius 15 overlaps left edge (dist = 10 < 15)
    expect(checkCircleAABBCollision(90, 125, 15, box)).toBe(true);
    // Circle center (70, 125) with radius 15 does not overlap (dist = 30 > 15)
    expect(checkCircleAABBCollision(70, 125, 15, box)).toBe(false);
    // Circle inside box
    expect(checkCircleAABBCollision(125, 125, 10, box)).toBe(true);
  });

  it('detects line segment intersections', () => {
    // Perpendicular crossing segments
    expect(doLineSegmentsIntersect(0, 5, 10, 5, 5, 0, 5, 10)).toBe(true);
    // Parallel non-intersecting
    expect(doLineSegmentsIntersect(0, 0, 10, 0, 0, 5, 10, 5)).toBe(false);
    // Collinear non-overlapping
    expect(doLineSegmentsIntersect(0, 0, 5, 0, 6, 0, 10, 0)).toBe(false);
  });

  it('detects line-of-sight intersection with acoustic obstacle', () => {
    const obstacle = { x: 100, y: 100, width: 20, height: 100 }; // Vertical partition
    // Ray from (50, 150) to (150, 150) crosses the obstacle
    expect(checkSegmentIntersectsObstacle(50, 150, 150, 150, obstacle)).toBe(true);
    // Ray from (50, 50) to (150, 50) passes above the obstacle
    expect(checkSegmentIntersectsObstacle(50, 50, 150, 50, obstacle)).toBe(false);
  });

  it('converts pixels to GeoJSON and back consistently', () => {
    const x = 500;
    const y = 300;
    const [lng, lat] = pixelToGeoJSON(x, y);
    expect(lng).toBeGreaterThan(0);
    expect(lat).toBeGreaterThan(0);

    const reversed = geoJSONToPixel(lng, lat);
    expect(reversed.x).toBeCloseTo(x, 0);
    expect(reversed.y).toBeCloseTo(y, 0);
  });
});

