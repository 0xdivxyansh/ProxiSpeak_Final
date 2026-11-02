/**
 * Final Proxispeak - Backend Validation Schemas (Zod)
 */

import { z } from 'zod';
import { WORKSPACE_DEFAULTS, AVATAR_DEFAULTS } from '@proxispeak/shared';

// Create Room Schema
export const createRoomSchema = z.object({
  roomId: z
    .string()
    .min(3, 'Room ID must be at least 3 characters')
    .max(50, 'Room ID cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Room ID may only contain alphanumeric characters, dashes, and underscores'),
  name: z
    .string()
    .min(2, 'Room name must be at least 2 characters')
    .max(100, 'Room name cannot exceed 100 characters'),
  layoutId: z.string().default('default-office-layout'),
  maxCapacity: z.number().int().min(2).max(200).default(50)
});

// Join Room Socket Payload Schema
export const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(30, 'Display name cannot exceed 30 characters')
    .trim(),
  preferredColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  initialPosition: z
    .object({
      x: z.number().min(0).max(WORKSPACE_DEFAULTS.WIDTH),
      y: z.number().min(0).max(WORKSPACE_DEFAULTS.HEIGHT)
    })
    .optional()
});

// Movement Socket Payload Schema
export const movementPayloadSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  facing: z.enum(['up', 'down', 'left', 'right']).optional().default('down'),
  timestamp: z.number().positive().optional()
});

// Mute Socket Payload Schema
export const mutePayloadSchema = z.object({
  isMuted: z.boolean()
});

// WebRTC Signaling Schemas
export const webrtcOfferSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  sdp: z.object({
    type: z.literal('offer'),
    sdp: z.string().max(65536, 'SDP is too large')
  })
});

export const webrtcAnswerSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  sdp: z.object({
    type: z.literal('answer'),
    sdp: z.string().max(65536, 'SDP is too large')
  })
});

export const webrtcIceCandidateSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  candidate: z.object({
    candidate: z.string().max(2048),
    sdpMid: z.string().nullable().optional(),
    sdpMLineIndex: z.number().nullable().optional(),
    usernameFragment: z.string().nullable().optional()
  })
});

// Proximity Query Params Schema
export const proximityQuerySchema = z.object({
  x: z.coerce.number().min(0).max(WORKSPACE_DEFAULTS.WIDTH),
  y: z.coerce.number().min(0).max(WORKSPACE_DEFAULTS.HEIGHT),
  radius: z.coerce.number().min(1).max(500).default(100)
});

