/**
 * Final Proxispeak - Server-Authoritative Movement Validator
 */

import { calculateDistance, AVATAR_DEFAULTS, WORKSPACE_DEFAULTS } from '@proxispeak/shared';
import { checkAvatarCollision } from './collisionEngine.js';

/**
 * Validates a requested avatar movement update.
 * Enforces coordinate boundaries, speed limits, and obstacle collisions.
 *
 * @param {object} currentSession Active user session with previous coordinates
 * @param {object} requestedMove Requested update { x, y, facing, timestamp }
 * @param {Array} furniture Room furniture obstacles
 * @returns {{ isValid: boolean, correctedPosition?: { x: number, y: number }, reason?: string }}
 */
export function validateMovement(currentSession, requestedMove, furniture = []) {
  const { x, y } = requestedMove;

  // 1. Basic coordinate sanity
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return {
      isValid: false,
      correctedPosition: { x: currentSession.x, y: currentSession.y },
      reason: 'INVALID_COORDINATES'
    };
  }

  // 2. Velocity check (anti-teleportation)
  if (currentSession.lastActiveTimestamp && requestedMove.timestamp) {
    const timeDeltaSeconds = Math.max(0.016, (requestedMove.timestamp - currentSession.lastActiveTimestamp) / 1000);
    const distance = calculateDistance(currentSession.x, currentSession.y, x, y);
    const velocity = distance / timeDeltaSeconds;

    // Allow a small grace margin for network jitter
    if (velocity > AVATAR_DEFAULTS.MAX_ALLOWED_PPS * 1.5 && distance > 50) {
      return {
        isValid: false,
        correctedPosition: { x: currentSession.x, y: currentSession.y },
        reason: 'EXCESSIVE_VELOCITY'
      };
    }
  }

  // 3. Collision check
  const collisionResult = checkAvatarCollision(
    x,
    y,
    furniture,
    AVATAR_DEFAULTS.RADIUS,
    { width: WORKSPACE_DEFAULTS.WIDTH, height: WORKSPACE_DEFAULTS.HEIGHT }
  );

  if (collisionResult.collides) {
    return {
      isValid: false,
      correctedPosition: { x: currentSession.x, y: currentSession.y },
      reason: collisionResult.reason
    };
  }

  return { isValid: true };
}
