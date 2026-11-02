/**
 * Final Proxispeak - Avatar & Proximity Circle Canvas Renderer
 */

import { AVATAR_DEFAULTS } from '@proxispeak/shared';
import { WORKSPACE_CONFIG } from '../../constants/config.js';

/**
 * Draws a facing direction pointer triangle
 */
function drawFacingIndicator(ctx, x, y, radius, facing) {
  ctx.save();
  ctx.fillStyle = '#ffffff';

  let angle = 0;
  if (facing === 'right') angle = 0;
  else if (facing === 'down') angle = Math.PI / 2;
  else if (facing === 'left') angle = Math.PI;
  else if (facing === 'up') angle = -Math.PI / 2;

  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(radius + 2, 0);
  ctx.lineTo(radius - 5, -4);
  ctx.lineTo(radius - 5, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a name tag and status pill above the avatar
 */
function drawNameTag(ctx, x, y, name, isLocal = false, isMuted = false, inRange = false) {
  ctx.save();
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  const text = isLocal ? `${name} (You)` : name;
  const metrics = ctx.measureText(text);
  const tagWidth = metrics.width + 16;
  const tagHeight = 18;
  const tagX = x - tagWidth / 2;
  const tagY = y - 36;

  // Background pill
  ctx.fillStyle = inRange ? 'rgba(14, 165, 233, 0.9)' : 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 9);
  ctx.fill();

  ctx.strokeStyle = inRange ? '#38bdf8' : '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Name text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, tagY + tagHeight / 2);

  // Mute badge if muted
  if (isMuted) {
    const badgeX = tagX + tagWidth + 2;
    const badgeY = tagY + 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(badgeX + 6, badgeY + 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Small 'M' text inside mute badge
    ctx.font = '700 8px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('M', badgeX + 6, badgeY + 7);
  }

  ctx.restore();
}

export function renderAvatars(ctx, localUser, remoteUsers = [], proximityPeerIds = new Set(), localAudioLevel = 0) {
  const radius = AVATAR_DEFAULTS.RADIUS;

  // 1. Render Local User's 100px Proximity Activation Circle
  if (localUser) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Sky blue dashed ring
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(localUser.x, localUser.y, WORKSPACE_CONFIG.PROXIMITY_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Render Remote Avatars
  for (const peer of remoteUsers) {
    const inRange = proximityPeerIds.has(peer.userId);

    ctx.save();

    // Proximity connection beam/halo if in range
    if (inRange && localUser) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(localUser.x, localUser.y);
      ctx.lineTo(peer.x, peer.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow ring around nearby peer
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(peer.x, peer.y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Avatar Circle
    ctx.fillStyle = peer.color || '#38bdf8';
    ctx.beginPath();
    ctx.arc(peer.x, peer.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = inRange ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Direction pointer
    drawFacingIndicator(ctx, peer.x, peer.y, radius, peer.facing || 'down');

    // Name Tag
    drawNameTag(ctx, peer.x, peer.y, peer.displayName, false, peer.isMuted, inRange);

    ctx.restore();
  }

  // 3. Render Local User Avatar
  if (localUser) {
    ctx.save();

    // Speaking activity pulse ring
    if (localAudioLevel > 0.05 && !localUser.isMuted) {
      const pulseSize = radius + 4 + localAudioLevel * 14;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)'; // Emerald audio ring
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(localUser.x, localUser.y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = localUser.color || '#38bdf8';
    ctx.beginPath();
    ctx.arc(localUser.x, localUser.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Distinct border for local avatar
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Facing indicator
    drawFacingIndicator(ctx, localUser.x, localUser.y, radius, localUser.facing || 'down');

    // Name Tag
    drawNameTag(ctx, localUser.x, localUser.y, localUser.displayName, true, localUser.isMuted, false);

    ctx.restore();
  }
}

