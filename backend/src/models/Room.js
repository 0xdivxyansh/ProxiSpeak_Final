/**
 * Final Proxispeak - Room Mongoose Model
 */

import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: {
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
    layoutId: {
      type: String,
      required: true,
      default: 'default-office-layout'
    },
    maxCapacity: {
      type: Number,
      default: 50,
      min: 2,
      max: 200
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
