/**
 * Final Proxispeak - Dynamic Spatial Audio Engine (Web Audio API)
 *
 * Implements:
 * - Dynamic distance-based gain attenuation (inverse-distance curve)
 * - Stereo panning (StereoPannerNode) based on relative horizontal direction
 * - Acoustic obstacle attenuation factor
 * - Smooth AudioParam linear ramping to eliminate audible pops
 */

import { audioContextService } from './audioContextService.js';
import { WORKSPACE_CONFIG } from '../../constants/config.js';
import { checkSegmentIntersectsObstacle, PROXIMITY_DEFAULTS } from '@proxispeak/shared';

export function calculateOcclusion(x1, y1, x2, y2, furniture = []) {
  for (const item of furniture) {
    if (!item.isAcousticObstacle) continue;
    if (checkSegmentIntersectsObstacle(x1, y1, x2, y2, item)) {
      return { isOccluded: true, attenuationFactor: PROXIMITY_DEFAULTS.OCCLUSION_FACTOR };
    }
  }
  return { isOccluded: false, attenuationFactor: 1.0 };
}

export function calculateDistanceGain(distance, maxRadius = WORKSPACE_CONFIG.PROXIMITY_RADIUS) {
  if (distance <= 0) return 1.0;
  if (distance >= maxRadius) return 0.0;

  // Inverse-distance style curve with smooth fadeout at 100px boundary
  const normalizedDistance = distance / maxRadius; // 0.0 at 0px -> 1.0 at 100px
  const gain = Math.pow(1 - normalizedDistance, 1.25);
  return Math.max(0.0, Math.min(1.0, Number(gain.toFixed(4))));
}

export function calculateStereoPan(listenerX, speakerX, maxDistance = WORKSPACE_CONFIG.PROXIMITY_RADIUS) {
  const dx = speakerX - listenerX;
  // Normalized between -1.0 (left) and +1.0 (right), clamped to -0.95 and +0.95
  const rawPan = dx / maxDistance;
  return Math.max(-0.95, Math.min(0.95, Number(rawPan.toFixed(3))));
}

export class SpatialAudioEngine {
  constructor() {
    // Map<peerId, { sourceNode, pannerNode, gainNode, stream }>
    this.peerAudioGraphs = new Map();
  }

  attachRemoteAudio(peerId, remoteStream) {
    const ctx = audioContextService.getAudioContext();
    if (!ctx) return;

    // Clean up existing graph if any
    this.detachRemoteAudio(peerId);

    try {
      const sourceNode = ctx.createMediaStreamSource(remoteStream);
      let pannerNode = null;

      // StereoPannerNode support
      if (typeof ctx.createStereoPanner === 'function') {
        pannerNode = ctx.createStereoPanner();
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0, ctx.currentTime);

      if (pannerNode) {
        sourceNode.connect(pannerNode);
        pannerNode.connect(gainNode);
      } else {
        sourceNode.connect(gainNode);
      }

      gainNode.connect(ctx.destination);

      this.peerAudioGraphs.set(peerId, {
        sourceNode,
        pannerNode,
        gainNode,
        stream: remoteStream,
        lastGain: 0,
        lastPan: 0
      });

      console.log(`[SpatialAudio] Attached audio graph for peer: ${peerId}`);
    } catch (err) {
      console.error(`[SpatialAudio] Error attaching audio for ${peerId}:`, err.message);
    }
  }

  updateSpatialAudio(peerId, listenerX, listenerY, speakerX, speakerY, occlusionFactor = 1.0) {
    const graph = this.peerAudioGraphs.get(peerId);
    if (!graph) return;

    const ctx = audioContextService.getAudioContext();
    if (!ctx) return;

    const dx = speakerX - listenerX;
    const dy = speakerY - listenerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Compute raw distance gain
    const baseGain = calculateDistanceGain(distance, WORKSPACE_CONFIG.PROXIMITY_RADIUS);
    // Apply acoustic obstacle occlusion attenuation factor
    const finalGain = Math.max(0.0, Math.min(1.0, baseGain * occlusionFactor));

    // Compute stereo pan
    const panValue = calculateStereoPan(listenerX, speakerX, WORKSPACE_CONFIG.PROXIMITY_RADIUS);

    // Smooth gain change over 30ms to prevent pops/clicks
    const currentTime = ctx.currentTime;
    graph.gainNode.gain.cancelScheduledValues(currentTime);
    graph.gainNode.gain.linearRampToValueAtTime(finalGain, currentTime + 0.03);

    // Update pan if supported
    if (graph.pannerNode) {
      graph.pannerNode.pan.cancelScheduledValues(currentTime);
      graph.pannerNode.pan.linearRampToValueAtTime(panValue, currentTime + 0.03);
    }

    graph.lastGain = finalGain;
    graph.lastPan = panValue;
  }

  detachRemoteAudio(peerId) {
    const graph = this.peerAudioGraphs.get(peerId);
    if (!graph) return;

    try {
      if (graph.gainNode) graph.gainNode.disconnect();
      if (graph.pannerNode) graph.pannerNode.disconnect();
      if (graph.sourceNode) graph.sourceNode.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

    this.peerAudioGraphs.delete(peerId);
    console.log(`[SpatialAudio] Detached audio graph for peer: ${peerId}`);
  }

  clear() {
    for (const peerId of this.peerAudioGraphs.keys()) {
      this.detachRemoteAudio(peerId);
    }
  }
}

export const spatialAudioEngine = new SpatialAudioEngine();
