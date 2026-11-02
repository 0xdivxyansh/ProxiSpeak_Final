/**
 * Final Proxispeak - UserSession Mongoose Model with GeoJSON 2dsphere index
 */

import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    socketId: {
      type: String,
      required: true,
      index: true
    },
    roomId: {
      type: String,
      required: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      required: true,
      default: '#38bdf8'
    },
    // GeoJSON Point representation for MongoDB geospatial 2dsphere indexing
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    // Planar pixel coordinates (1:1 workspace map)
    planarPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    facing: {
      type: String,
      enum: ['up', 'down', 'left', 'right'],
      default: 'down'
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for room-isolated geospatial spherical queries
userSessionSchema.index({ roomId: 1, location: '2dsphere' });
userSessionSchema.index({ roomId: 1, socketId: 1 });

export const UserSession =
  mongoose.models.UserSession || mongoose.model('UserSession', userSessionSchema);
