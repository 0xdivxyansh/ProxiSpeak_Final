/**
 * Final Proxispeak - Layout Mongoose Model
 */

import mongoose from 'mongoose';

const furnitureItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'wall',
        'meeting_table',
        'desk',
        'sofa',
        'coffee_table',
        'plant',
        'whiteboard',
        'acoustic_partition',
        'water_cooler',
        'bed',
        'dining_table',
        'kitchen_counter',
        'refrigerator',
        'tv_unit',
        'bookshelf',
        'bathtub',
        'rug'
      ],
      required: true
    },
    label: { type: String, default: '' },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    isSolid: { type: Boolean, default: true },
    isAcousticObstacle: { type: Boolean, default: false },
    color: { type: String, default: '#334155' }
  },
  { _id: false }
);

const layoutSchema = new mongoose.Schema(
  {
    layoutId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    dimensions: {
      width: { type: Number, required: true, default: 1600 },
      height: { type: Number, required: true, default: 1000 }
    },
    spawnPoint: {
      x: { type: Number, default: 800 },
      y: { type: Number, default: 880 }
    },
    furniture: [furnitureItemSchema]
  },
  {
    timestamps: true
  }
);

export const Layout = mongoose.models.Layout || mongoose.model('Layout', layoutSchema);
