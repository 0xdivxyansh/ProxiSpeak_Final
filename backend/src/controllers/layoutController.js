/**
 * Final Proxispeak - Layout HTTP Controller
 */

import * as layoutService from '../services/layoutService.js';

export async function getLayouts(req, res, next) {
  try {
    const layouts = await layoutService.getAllLayouts();
    res.json({
      success: true,
      count: layouts.length,
      data: layouts
    });
  } catch (error) {
    next(error);
  }
}

export async function getLayoutById(req, res, next) {
  try {
    const { layoutId } = req.params;
    const layout = await layoutService.getLayoutById(layoutId);
    if (!layout) {
      return res.status(404).json({
        success: false,
        error: { message: `Layout "${layoutId}" not found`, code: 'LAYOUT_NOT_FOUND' }
      });
    }
    res.json({
      success: true,
      data: layout
    });
  } catch (error) {
    next(error);
  }
}

