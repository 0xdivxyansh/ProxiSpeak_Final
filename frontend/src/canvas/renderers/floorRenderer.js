/**
 * Final Proxispeak - Floor & Office Grid Canvas Renderer
 */

import { WORKSPACE_DEFAULTS } from '@proxispeak/shared';

export function renderFloor(ctx, width, height, roomName = 'Virtual Office') {
  // 1. Draw Office Floor Background
  ctx.fillStyle = '#0f172a'; // Deep slate
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Subtle Engineering Grid
  const gridSize = WORKSPACE_DEFAULTS.GRID_SIZE;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 3. Draw Perimeter Walls / Office Border
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, width, height);

  // 4. Subtle Zone Watermarks
  ctx.save();
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.textAlign = 'center';
  ctx.fillText('CONFERENCE & MEETING ZONE', 320, 80);
  ctx.fillText('CENTRAL COLLABORATION HUB', 800, 80);
  ctx.fillText('OPEN WORKSPACES & PODS', 1280, 80);
  ctx.fillText('LOUNGE & ACOUSTIC QUIET BOOTHS', 800, 940);
  ctx.restore();
}

