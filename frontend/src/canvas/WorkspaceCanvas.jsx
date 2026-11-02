/**
 * Final Proxispeak - HTML5 Canvas Workspace Component
 */

import React, { useRef, useEffect, useState } from 'react';
import { Camera2D } from './camera/camera2D.js';
import { KeyboardController } from './input/keyboardController.js';
import { renderFloor } from './renderers/floorRenderer.js';
import { renderFurniture } from './renderers/furnitureRenderer.js';
import { renderAvatars } from './renderers/avatarRenderer.js';
import { audioContextService } from '../services/audio/audioContextService.js';
import { spatialAudioEngine } from '../services/audio/spatialAudioEngine.js';
import { calculateOcclusion } from '../services/audio/spatialAudioEngine.js';

export function WorkspaceCanvas({
  localUser,
  remoteUsers = [],
  layout,
  proximityPeerIds = new Set(),
  onLocalMove = () => {},
  fpsReport = () => {}
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Local state references for animation loop without causing React re-renders
  const localUserRef = useRef(localUser);
  const remoteUsersRef = useRef(remoteUsers);
  const interpolatedPeersRef = useRef(new Map()); // Map<userId, { x, y, facing, targetX, targetY }>
  const layoutRef = useRef(layout);
  const proximityPeerIdsRef = useRef(proximityPeerIds);

  useEffect(() => {
    localUserRef.current = localUser;
  }, [localUser]);

  useEffect(() => {
    remoteUsersRef.current = remoteUsers;
    // Update target positions for remote users
    const map = interpolatedPeersRef.current;
    for (const peer of remoteUsers) {
      if (!map.has(peer.userId)) {
        map.set(peer.userId, {
          ...peer,
          targetX: peer.x,
          targetY: peer.y
        });
      } else {
        const existing = map.get(peer.userId);
        existing.targetX = peer.x;
        existing.targetY = peer.y;
        existing.facing = peer.facing;
        existing.isMuted = peer.isMuted;
        existing.displayName = peer.displayName;
        existing.color = peer.color;
      }
    }
    // Delete disconnected users
    for (const id of map.keys()) {
      if (!remoteUsers.some((u) => u.userId === id)) {
        map.delete(id);
      }
    }
  }, [remoteUsers]);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    proximityPeerIdsRef.current = proximityPeerIds;
  }, [proximityPeerIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const camera = new Camera2D(container.clientWidth, container.clientHeight);

    const keyboardController = new KeyboardController({
      furniture: layout?.furniture || [],
      bounds: layout?.dimensions || { width: 1600, height: 1000 }
    });
    keyboardController.attach();

    let animationFrameId;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    // Resize handler
    const handleResize = () => {
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      camera.resize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Main 60 FPS Canvas Game Loop
    const renderLoop = (currentTime) => {
      const deltaTime = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Measure FPS
      frameCount++;
      if (currentTime - lastFpsTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (currentTime - lastFpsTime));
        fpsReport(currentFps);
        frameCount = 0;
        lastFpsTime = currentTime;
      }

      const activeLayout = layoutRef.current;
      const furniture = activeLayout?.furniture || [];
      const workspaceWidth = activeLayout?.dimensions?.width || 1600;
      const workspaceHeight = activeLayout?.dimensions?.height || 1000;

      keyboardController.setFurniture(furniture);
      keyboardController.setBounds({ width: workspaceWidth, height: workspaceHeight });

      // 1. Process Local Movement
      if (localUserRef.current) {
        const moveResult = keyboardController.update(localUserRef.current, deltaTime);
        if (moveResult.moved) {
          localUserRef.current = {
            ...localUserRef.current,
            ...moveResult.position
          };
          onLocalMove(moveResult.position.x, moveResult.position.y, moveResult.position.facing);
        }

        // Center Camera on local avatar
        camera.follow(localUserRef.current.x, localUserRef.current.y, workspaceWidth, workspaceHeight);
      }

      // 2. Smoothly Interpolate Remote Avatars (lerp damping = 0.25)
      const peersToRender = [];
      for (const peer of interpolatedPeersRef.current.values()) {
        peer.x += (peer.targetX - peer.x) * 0.25;
        peer.y += (peer.targetY - peer.y) * 0.25;
        peersToRender.push(peer);

        // Update spatial audio engine dynamically as positions update with acoustic occlusion check
        if (localUserRef.current && proximityPeerIdsRef.current.has(peer.userId)) {
          const occlusion = calculateOcclusion(
            localUserRef.current.x,
            localUserRef.current.y,
            peer.x,
            peer.y,
            furniture
          );
          spatialAudioEngine.updateSpatialAudio(
            peer.userId,
            localUserRef.current.x,
            localUserRef.current.y,
            peer.x,
            peer.y,
            occlusion.attenuationFactor
          );
        }
      }

      // 3. Clear Screen
      const dpr = window.devicePixelRatio || 1;
      const viewW = canvas.width / dpr;
      const viewH = canvas.height / dpr;
      ctx.clearRect(0, 0, viewW, viewH);

      // 4. Apply Camera Transform
      ctx.save();
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

      // 5. Draw Layers
      renderFloor(ctx, workspaceWidth, workspaceHeight, activeLayout?.name);
      renderFurniture(ctx, furniture);

      const localAudioLevel = audioContextService.getAudioLevel();
      renderAvatars(
        ctx,
        localUserRef.current,
        peersToRender,
        proximityPeerIdsRef.current,
        localAudioLevel
      );

      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      keyboardController.detach();
      window.removeEventListener('resize', handleResize);
    };
  }, [layout, onLocalMove, fpsReport]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#020617'
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', outline: 'none' }} tabIndex={0} />
    </div>
  );
}
