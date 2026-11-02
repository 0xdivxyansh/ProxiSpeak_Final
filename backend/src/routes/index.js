/**
 * Final Proxispeak - Master API Router
 */

import { Router } from 'express';
import { healthRoutes } from './healthRoutes.js';
import { roomRoutes } from './roomRoutes.js';
import { layoutRoutes } from './layoutRoutes.js';
import { proximityRoutes } from './proximityRoutes.js';

export const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(roomRoutes);
apiRouter.use(layoutRoutes);
apiRouter.use(proximityRoutes);

