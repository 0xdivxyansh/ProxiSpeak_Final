/**
 * Final Proxispeak - Server & Shared Audio Occlusion Engine
 */

import { checkSegmentIntersectsObstacle, PROXIMITY_DEFAULTS } from '@proxispeak/shared';

/**
 * Calculates acoustic line-of-sight occlusion between listener and speaker.
 *
 * @param {number} x1 Listener X
 * @param {number} y1 Listener Y
 * @param {number} x2 Speaker X
 * @param {number} y2 Speaker Y
 * @param {Array} furniture Layout furniture items
 * @returns {{ isOccluded: boolean, obstacle: object | null, attenuationFactor: number }}
 */
export function calculateOcclusion(x1, y1, x2, y2, furniture = []) {
  for (const item of furniture) {
    // Only items explicitly marked as acoustic obstacles attenuate sound
    if (!item.isAcousticObstacle) continue;

    const blocksLineOfSight = checkSegmentIntersectsObstacle(x1, y1, x2, y2, item);
    if (blocksLineOfSight) {
      return {
        isOccluded: true,
        obstacle: item,
        attenuationFactor: PROXIMITY_DEFAULTS.OCCLUSION_FACTOR // 0.25 (75% volume reduction)
      };
    }
  }

  return {
    isOccluded: false,
    obstacle: null,
    attenuationFactor: 1.0 // 100% direct line-of-sight audio
  };
}
