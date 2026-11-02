/**
 * Final Proxispeak - Proximity Diagnostic Routes
 */

import { Router } from 'express';
import { queryProximity } from '../controllers/proximityController.js';

export const proximityRoutes = Router();

proximityRoutes.get('/rooms/:roomId/proximity', queryProximity);

