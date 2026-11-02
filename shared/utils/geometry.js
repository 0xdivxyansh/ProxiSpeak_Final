/**
 * Final Proxispeak - Shared Geometric, Collision, and Occlusion Utilities
 */

/**
 * Calculates Euclidean planar distance between two points
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Axis-Aligned Bounding Box (AABB) intersection check with a circle
 * @param {number} cx Circle center X
 * @param {number} cy Circle center Y
 * @param {number} cr Circle radius
 * @param {object} box { x, y, width, height }
 * @returns {boolean}
 */
export function checkCircleAABBCollision(cx, cy, cr, box) {
  // Find closest point on AABB to circle center
  const closestX = Math.max(box.x, Math.min(cx, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(cy, box.y + box.height));

  const distance = calculateDistance(cx, cy, closestX, closestY);
  return distance < cr;
}

/**
 * Checks if a point is within an AABB rectangle
 * @param {number} px
 * @param {number} py
 * @param {object} box { x, y, width, height }
 * @returns {boolean}
 */
export function isPointInAABB(px, py, box) {
  return (
    px >= box.x &&
    px <= box.x + box.width &&
    py >= box.y &&
    py <= box.y + box.height
  );
}

/**
 * Checks if two line segments (p1-p2 and p3-p4) intersect
 * @param {number} x1 @param {number} y1
 * @param {number} x2 @param {number} y2
 * @param {number} x3 @param {number} y3
 * @param {number} x4 @param {number} y4
 * @returns {boolean}
 */
export function doLineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  function ccw(ax, ay, bx, by, cx, cy) {
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
  }

  const check1 = ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4);
  const check2 = ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4);

  return check1 && check2;
}

/**
 * Checks if a line segment between listener and speaker intersects an acoustic obstacle (AABB)
 * @param {number} x1 Listener X
 * @param {number} y1 Listener Y
 * @param {number} x2 Speaker X
 * @param {number} y2 Speaker Y
 * @param {object} obstacle { x, y, width, height }
 * @returns {boolean}
 */
export function checkSegmentIntersectsObstacle(x1, y1, x2, y2, obstacle) {
  const { x, y, width, height } = obstacle;
  const right = x + width;
  const bottom = y + height;

  // If either endpoint is inside the obstacle
  if (isPointInAABB(x1, y1, obstacle) || isPointInAABB(x2, y2, obstacle)) {
    return true;
  }

  // Check all four edges of the obstacle
  // Top edge: (x, y) to (right, y)
  if (doLineSegmentsIntersect(x1, y1, x2, y2, x, y, right, y)) return true;
  // Right edge: (right, y) to (right, bottom)
  if (doLineSegmentsIntersect(x1, y1, x2, y2, right, y, right, bottom)) return true;
  // Bottom edge: (x, bottom) to (right, bottom)
  if (doLineSegmentsIntersect(x1, y1, x2, y2, x, bottom, right, bottom)) return true;
  // Left edge: (x, y) to (x, bottom)
  if (doLineSegmentsIntersect(x1, y1, x2, y2, x, y, x, bottom)) return true;

  return false;
}

/**
 * Coordinate mapping: Converts planar virtual office pixel coordinates (x, y)
 * to a standardized GeoJSON [longitude, latitude] pair around prime meridian / equator.
 * Scale: 1 pixel = 1 meter (~0.000008983 degrees latitude).
 *
 * @param {number} x Pixel X coordinate
 * @param {number} y Pixel Y coordinate
 * @returns {[number, number]} [longitude, latitude]
 */
export const METERS_PER_PIXEL = 1.0;
export const DEGREES_PER_METER = 1 / 111319.9; // Approximate meters per degree at equator

export function pixelToGeoJSON(x, y) {
  const lng = Number((x * METERS_PER_PIXEL * DEGREES_PER_METER).toFixed(7));
  const lat = Number((y * METERS_PER_PIXEL * DEGREES_PER_METER).toFixed(7));
  return [lng, lat];
}

/**
 * Reverse coordinate mapping: Converts GeoJSON [longitude, latitude] to planar pixels.
 * @param {number} lng
 * @param {number} lat
 * @returns {{x: number, y: number}}
 */
export function geoJSONToPixel(lng, lat) {
  const x = Math.round((lng / DEGREES_PER_METER) / METERS_PER_PIXEL);
  const y = Math.round((lat / DEGREES_PER_METER) / METERS_PER_PIXEL);
  return { x, y };
}
