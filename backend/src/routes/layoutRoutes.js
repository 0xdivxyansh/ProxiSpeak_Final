/**
 * Final Proxispeak - Layout Routes
 */

import { Router } from 'express';
import { getLayouts, getLayoutById } from '../controllers/layoutController.js';

export const layoutRoutes = Router();

layoutRoutes.get('/layouts', getLayouts);
layoutRoutes.get('/layouts/:layoutId', getLayoutById);

