/**
 * Final Proxispeak - Server-Side Collision Engine
 */

import { checkCircleAABBCollision, AVATAR_DEFAULTS, WORKSPACE_DEFAULTS } from '@proxispeak/shared';

/**
 * Checks if an avatar position collides with workspace walls or any solid furniture.
 *
 * @param {number} x Avatar center X
 * @param {number} y Avatar center Y
 * @param {Array} furniture List of furniture obstacles from layout
 * @param {number} radius Avatar radius (default: 18px)
 * @param {object} bounds Workspace dimensions { width, height }
 * @returns {{ collides: boolean, obstacle: object | null, reason: string | null }}
 */
export function checkAvatarCollision(
  x,
  y,
  furniture = [],
  radius = AVATAR_DEFAULTS.RADIUS,
  bounds = { width: WORKSPACE_DEFAULTS.WIDTH, height: WORKSPACE_DEFAULTS.HEIGHT }
) {
  // 1. Check workspace perimeter boundaries
  if (x - radius < 0 || x + radius > bounds.width || y - radius < 0 || y + radius > bounds.height) {
    return {
      collides: true,
      obstacle: null,
      reason: 'OUT_OF_BOUNDS'
    };
  }

  // 2. Check solid furniture items
  for (const item of furniture) {
    if (!item.isSolid) continue;

    const hasOverlap = checkCircleAABBCollision(x, y, radius, {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    });

    if (hasOverlap) {
      return {
        collides: true,
        obstacle: item,
        reason: 'OBSTACLE_COLLISION'
      };
    }
  }

  return {
    collides: false,
    obstacle: null,
    reason: null
  };
}
