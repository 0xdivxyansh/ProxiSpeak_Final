/**
 * Final Proxispeak - Furniture & Obstacles Canvas Renderer
 */

export function renderFurniture(ctx, furniture = []) {
  for (const item of furniture) {
    const { type, x, y, width, height, label, color, isAcousticObstacle } = item;

    ctx.save();

    if (type === 'wall') {
      // Solid Wall
      ctx.fillStyle = color || '#334155';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    } else if (type === 'acoustic_partition') {
      // Acoustic Soundproof Partition
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, y, width, height);

      // Acoustic wave stripe pattern
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw sound insulation icon / hashes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      const step = Math.min(width, height) > 25 ? 12 : 6;
      for (let offset = step; offset < Math.max(width, height); offset += step) {
        ctx.beginPath();
        if (width > height) {
          ctx.moveTo(x + offset, y);
          ctx.lineTo(x + offset, y + height);
        } else {
          ctx.moveTo(x, y + offset);
          ctx.lineTo(x + width, y + offset);
        }
        ctx.stroke();
      }
    } else if (type === 'meeting_table') {
      // Large Conference Table
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 16);
      ctx.fill();
      ctx.stroke();

      // Table inner inlay
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 10, y + 10, width - 20, height - 20);
    } else if (type === 'desk') {
      // Workstation Desk
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 6);
      ctx.fill();
      ctx.stroke();

      // Monitor / laptop icon on desk
      ctx.fillStyle = '#0284c7';
      const monW = Math.min(width * 0.4, 30);
      const monH = 8;
      ctx.fillRect(x + (width - monW) / 2, y + 8, monW, monH);
    } else if (type === 'sofa') {
      // Soft Lounge Couch
      ctx.fillStyle = '#065f46'; // Forest green plush
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 10);
      ctx.fill();
      ctx.stroke();
    } else if (type === 'coffee_table') {
      ctx.fillStyle = '#78350f'; // Wood grain
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 6);
      ctx.fill();
    } else if (type === 'bed') {
      // Luxury Bed: Frame, Mattress, Pillows, and Blanket
      ctx.fillStyle = color || '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 8);
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Headboard
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, width, 14);

      // Pillows
      ctx.fillStyle = '#f8fafc';
      const pillowW = (width - 24) / 2;
      const pillowH = 22;
      ctx.beginPath();
      ctx.roundRect(x + 8, y + 18, pillowW, pillowH, 4);
      ctx.roundRect(x + 16 + pillowW, y + 18, pillowW, pillowH, 4);
      ctx.fill();

      // Duvet fold line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 46);
      ctx.lineTo(x + width - 4, y + 46);
      ctx.stroke();
    } else if (type === 'dining_table') {
      // Dining Table with Wood Tone and Table Setting
      ctx.fillStyle = color || '#b45309';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 12);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tabletop runner
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 10, y + height / 2 - 8, width - 20, 16);
    } else if (type === 'kitchen_counter') {
      // Kitchen Granite Countertop
      ctx.fillStyle = color || '#475569';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Counter surface accents / sink
      if (width > 50 && height > 50) {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, width - 20, height - 20, 4);
        ctx.fill();
      }
    } else if (type === 'refrigerator') {
      // Stainless Steel Double-Door Fridge
      ctx.fillStyle = color || '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 6);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Door division line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y + 4);
      ctx.lineTo(x + width / 2, y + height - 4);
      ctx.stroke();
    } else if (type === 'tv_unit') {
      // Home Entertainment TV Unit
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Screen glow indicator
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 10, y + height / 2 - 1, width - 20, 2);
    } else if (type === 'bookshelf') {
      // Hardwood Bookshelf with shelves
      ctx.fillStyle = color || '#78350f';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shelf dividers
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      const numDividers = Math.max(2, Math.floor(width / 30));
      for (let d = 1; d < numDividers; d++) {
        const dx = x + (width / numDividers) * d;
        ctx.beginPath();
        ctx.moveTo(dx, y + 2);
        ctx.lineTo(dx, y + height - 2);
        ctx.stroke();
      }
    } else if (type === 'bathtub') {
      // Porcelain Bathtub with Water
      ctx.fillStyle = color || '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 18);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Water inside
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(x + 8, y + 8, width - 16, height - 16, 12);
      ctx.fill();
    } else if (type === 'rug') {
      // Decorative Soft Area Rug (Non-solid floor overlay)
      ctx.fillStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
      ctx.setLineDash([]);
    } else if (type === 'whiteboard') {
      // 4K Presentation Display & Whiteboard
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pen tray
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 10, y + height - 3, width - 20, 2);
    } else if (type === 'water_cooler') {
      // Water Cooler Dispenser with Blue Bottle
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 6);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Circular water jug
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'plant') {
      // Circular potted plant
      const cx = x + width / 2;
      const cy = y + height / 2;
      const r = Math.min(width, height) / 2;

      ctx.fillStyle = '#15803d'; // Green foliage
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default Generic Solid Object
      ctx.fillStyle = color || '#334155';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(x, y, width, height);
    }

    // Furniture Label (if applicable)
    if (label && width > 40 && height > 25) {
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + width / 2, y + height / 2 + 3);
    }

    ctx.restore();
  }
}

