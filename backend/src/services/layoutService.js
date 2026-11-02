/**
 * Final Proxispeak - Layout Business Logic Service
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as layoutRepo from '../repositories/layoutRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultLayoutPath = path.resolve(__dirname, '../../../data/layouts/default-office.json');
const houseLayoutPath = path.resolve(__dirname, '../../../data/layouts/modern-house.json');

export async function getLayoutById(layoutId) {
  let layout = await layoutRepo.findLayoutById(layoutId);
  if (!layout) {
    if (layoutId === 'default-office-layout') {
      layout = await seedDefaultLayout();
    } else if (layoutId === 'modern-house-layout') {
      layout = await seedHouseLayout();
    }
  }
  return layout;
}

export async function getAllLayouts() {
  let layouts = await layoutRepo.findAllLayouts();
  if (layouts.length === 0 || !layouts.some((l) => l.layoutId === 'modern-house-layout')) {
    await seedDefaultLayout();
    await seedHouseLayout();
    layouts = await layoutRepo.findAllLayouts();
  }
  return layouts;
}

export async function seedHouseLayout() {
  try {
    if (fs.existsSync(houseLayoutPath)) {
      const data = JSON.parse(fs.readFileSync(houseLayoutPath, 'utf8'));
      const saved = await layoutRepo.upsertLayout(data);
      console.log(`[LayoutService] Seeded modern house layout: "${saved.name}" (${saved.layoutId})`);
      return saved;
    }
    return null;
  } catch (error) {
    console.error(`[LayoutService] Error seeding house layout: ${error.message}`);
    return null;
  }
}

export async function seedDefaultLayout() {
  try {
    await seedHouseLayout();
    if (fs.existsSync(defaultLayoutPath)) {
      const data = JSON.parse(fs.readFileSync(defaultLayoutPath, 'utf8'));
      const saved = await layoutRepo.upsertLayout(data);
      console.log(`[LayoutService] Seeded default layout: "${saved.name}" (${saved.layoutId})`);
      return saved;
    } else {
      console.warn(`[LayoutService] Warning: Default layout file not found at ${defaultLayoutPath}`);
      return null;
    }
  } catch (error) {
    console.error(`[LayoutService] Error seeding default layout: ${error.message}`);
    throw error;
  }
}
