/**
 * Final Proxispeak - Authoritative Proximity Engine
 */

import { calculateDistance, PROXIMITY_DEFAULTS } from '@proxispeak/shared';

export class ProximityEngine {
  constructor(options = {}) {
    this.activationRadius = options.activationRadius || PROXIMITY_DEFAULTS.ACTIVATION_RADIUS; // 100px
    this.hysteresisBuffer = options.hysteresisBuffer || PROXIMITY_DEFAULTS.HYSTERESIS_BUFFER; // 15px
    // Set of active pair keys: "minId:maxId"
    this.activePairs = new Set();
  }

  getPairKey(id1, id2) {
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  }

  isPairActive(id1, id2) {
    return this.activePairs.has(this.getPairKey(id1, id2));
  }

  /**
   * Evaluates proximity transitions for a moving user against all peers in the room.
   *
   * @param {object} movingUser { userId, socketId, roomId, x, y }
   * @param {Array<object>} roomUsers All active users in the same room
   * @returns {Array<object>} List of proximity transition events to emit
   */
  evaluateUserMovement(movingUser, roomUsers = []) {
    const transitions = [];

    for (const peer of roomUsers) {
      if (peer.userId === movingUser.userId) continue;

      const pairKey = this.getPairKey(movingUser.userId, peer.userId);
      const isCurrentlyConnected = this.activePairs.has(pairKey);
      const distance = calculateDistance(movingUser.x, movingUser.y, peer.x, peer.y);

      // Decision Rule:
      // Enter: distance <= 100px
      // Exit:  distance > 115px (100 + 15 hysteresis)
      if (!isCurrentlyConnected) {
        if (distance <= this.activationRadius) {
          this.activePairs.add(pairKey);
          // Polite peer is lexicographically smaller socket ID
          const isMovingUserPolite = movingUser.socketId < peer.socketId;

          transitions.push({
            type: 'ENTER',
            userA: movingUser,
            userB: peer,
            distance: Number(distance.toFixed(1)),
            inRange: true,
            isPoliteForA: isMovingUserPolite,
            isPoliteForB: !isMovingUserPolite
          });
        }
      } else {
        if (distance > this.activationRadius + this.hysteresisBuffer) {
          this.activePairs.delete(pairKey);

          transitions.push({
            type: 'EXIT',
            userA: movingUser,
            userB: peer,
            distance: Number(distance.toFixed(1)),
            inRange: false
          });
        } else {
          // Distance changed while remaining in proximity range
          transitions.push({
            type: 'DISTANCE_UPDATE',
            userA: movingUser,
            userB: peer,
            distance: Number(distance.toFixed(1)),
            inRange: true
          });
        }
      }
    }

    return transitions;
  }

  /**
   * Cleans up all proximity relationships when a user disconnects or leaves.
   *
   * @param {string} userId
   * @param {Array<object>} roomUsers Remaining users in the room
   * @returns {Array<object>} Teardown events for affected peers
   */
  handleUserDisconnect(userId, roomUsers = []) {
    const teardownEvents = [];

    for (const peer of roomUsers) {
      if (peer.userId === userId) continue;

      const pairKey = this.getPairKey(userId, peer.userId);
      if (this.activePairs.has(pairKey)) {
        this.activePairs.delete(pairKey);
        teardownEvents.push({
          type: 'EXIT',
          disconnectedUserId: userId,
          targetUser: peer,
          inRange: false
        });
      }
    }

    return teardownEvents;
  }

  /**
   * Verifies if two users are currently authorized for WebRTC signaling.
   *
   * @param {string} userIdA
   * @param {string} userIdB
   * @returns {boolean}
   */
  isSignalingAuthorized(userIdA, userIdB) {
    if (!userIdA || !userIdB || userIdA === userIdB) return false;
    return this.activePairs.has(this.getPairKey(userIdA, userIdB));
  }
}

export const defaultProximityEngine = new ProximityEngine();
