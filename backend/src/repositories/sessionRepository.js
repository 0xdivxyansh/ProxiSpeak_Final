/**
 * Final Proxispeak - UserSession Data Access Repository with Native MongoDB Geospatial Operations
 */

import { UserSession } from '../models/UserSession.js';
import { pixelToGeoJSON, METERS_PER_PIXEL } from '@proxispeak/shared';

export async function upsertSession(sessionData) {
  const { userId, socketId, roomId, displayName, color, x, y, facing, isMuted } = sessionData;
  const [lng, lat] = pixelToGeoJSON(x, y);

  return UserSession.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        socketId,
        roomId,
        displayName,
        color,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        planarPosition: { x, y },
        facing: facing || 'down',
        isMuted: isMuted ?? false,
        lastActive: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function removeSessionBySocketId(socketId) {
  return UserSession.findOneAndDelete({ socketId }).lean();
}

export async function removeSessionByUserId(userId) {
  return UserSession.findOneAndDelete({ userId }).lean();
}

export async function findSessionsByRoom(roomId) {
  return UserSession.find({ roomId }).lean();
}

export async function findSessionByUserId(userId) {
  return UserSession.findOne({ userId }).lean();
}

/**
 * Executes a native MongoDB $near geospatial query on 2dsphere index.
 * Strictly scopes results to the specified roomId.
 *
 * @param {string} roomId Virtual office room ID
 * @param {number} x Origin planar pixel X
 * @param {number} y Origin planar pixel Y
 * @param {number} radiusPixels Maximum search radius in pixels
 * @param {string} excludeUserId Optional user ID to exclude from results
 * @returns {Promise<Array>} List of nearby user sessions
 */
export async function findNearbyUsersWithNear(roomId, x, y, radiusPixels = 100, excludeUserId = null) {
  const [lng, lat] = pixelToGeoJSON(x, y);
  const maxDistanceMeters = radiusPixels * METERS_PER_PIXEL;

  const query = {
    roomId,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistanceMeters
      }
    }
  };

  if (excludeUserId) {
    query.userId = { $ne: excludeUserId };
  }

  return UserSession.find(query).lean();
}

/**
 * Executes a native MongoDB $geoWithin geospatial query on 2dsphere index using a bounding box ($box).
 * Strictly scopes results to the specified roomId.
 *
 * @param {string} roomId Virtual office room ID
 * @param {number} minX Top-left planar X
 * @param {number} minY Top-left planar Y
 * @param {number} maxX Bottom-right planar X
 * @param {number} maxY Bottom-right planar Y
 * @returns {Promise<Array>} List of user sessions located inside the bounded box
 */
export async function findUsersInRegionWithGeoWithin(roomId, minX, minY, maxX, maxY) {
  const [bottomLeftLng, bottomLeftLat] = pixelToGeoJSON(minX, minY);
  const [topRightLng, topRightLat] = pixelToGeoJSON(maxX, maxY);

  return UserSession.find({
    roomId,
    location: {
      $geoWithin: {
        $box: [
          [bottomLeftLng, bottomLeftLat],
          [topRightLng, topRightLat]
        ]
      }
    }
  }).lean();
}

export async function clearAllSessions() {
  return UserSession.deleteMany({});
}
