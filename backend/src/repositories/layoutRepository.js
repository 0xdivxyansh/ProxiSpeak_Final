/**
 * Final Proxispeak - Layout Data Access Repository
 */

import { Layout } from '../models/Layout.js';

export async function findAllLayouts() {
  return Layout.find({}, 'layoutId name description dimensions furniture').lean();
}

export async function findLayoutById(layoutId) {
  return Layout.findOne({ layoutId }).lean();
}

export async function upsertLayout(layoutData) {
  return Layout.findOneAndUpdate(
    { layoutId: layoutData.layoutId },
    { $set: layoutData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
