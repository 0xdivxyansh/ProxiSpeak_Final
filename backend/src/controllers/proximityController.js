/**
 * Final Proxispeak - Geospatial Proximity Diagnostic Controller
 */

import * as sessionRepo from '../repositories/sessionRepository.js';
import { proximityQuerySchema } from '../validation/schemas.js';

export async function queryProximity(req, res, next) {
  try {
    const { roomId } = req.params;
    const validated = proximityQuerySchema.parse(req.query);

    // Executes native MongoDB $near geospatial query on 2dsphere index
    const nearbySessions = await sessionRepo.findNearbyUsersWithNear(
      roomId,
      validated.x,
      validated.y,
      validated.radius
    );

    res.json({
      success: true,
      roomId,
      origin: { x: validated.x, y: validated.y },
      radiusPixels: validated.radius,
      count: nearbySessions.length,
      data: nearbySessions
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          code: 'INVALID_QUERY',
          details: error.errors
        }
      });
    }
    next(error);
  }
}

