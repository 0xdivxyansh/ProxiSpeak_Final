/**
 * Final Proxispeak - Client-Side Collision Check
 */

import { checkCircleAABBCollision, WORKSPACE_DEFAULTS, AVATAR_DEFAULTS } from '@proxispeak/shared';

export function checkClientCollision(
  x,
  y,
  furniture = [],
  radius = AVATAR_DEFAULTS.RADIUS,
  bounds = { width: WORKSPACE_DEFAULTS.WIDTH, height: WORKSPACE_DEFAULTS.HEIGHT }
) {
  // 1. Boundary check
  if (x - radius < 0 || x + radius > bounds.width || y - radius < 0 || y + radius > bounds.height) {
    return true;
  }

  // 2. Solid furniture check
  for (const item of furniture) {
    if (!item.isSolid) continue;

    const collides = checkCircleAABBCollision(x, y, radius, {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    });

    if (collides) return true;
  }

  return false;
}

