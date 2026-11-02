/**
 * Final Proxispeak - Keyboard Input Controller for Avatar Movement
 */

import { AVATAR_DEFAULTS, WORKSPACE_DEFAULTS } from '@proxispeak/shared';
import { checkClientCollision } from '../collision/clientCollision.js';

export class KeyboardController {
  constructor(options = {}) {
    this.keys = new Set();
    this.speed = options.speed || AVATAR_DEFAULTS.SPEED_PPS; // ~220 px/sec
    this.onMove = options.onMove || (() => {});
    this.furniture = options.furniture || [];
    this.bounds = options.bounds || {
      width: WORKSPACE_DEFAULTS.WIDTH,
      height: WORKSPACE_DEFAULTS.HEIGHT
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.keys.clear();
  }

  setFurniture(furniture) {
    this.furniture = furniture;
  }

  setBounds(bounds) {
    this.bounds = bounds;
  }

  handleKeyDown(e) {
    // Ignore input if user is typing in a form or input field
    const targetTag = e.target?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
      return;
    }

    const key = e.code;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(key)) {
      e.preventDefault();
      this.keys.add(key);
    }
  }

  handleKeyUp(e) {
    this.keys.delete(e.code);
  }

  handleBlur() {
    this.keys.clear();
  }

  /**
   * Returns current active directional keys.
   * @returns {{ up: boolean, down: boolean, left: boolean, right: boolean }}
   */
  getInput() {
    return {
      up: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      down: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight')
    };
  }

  /**
   * Updates avatar position based on delta time (seconds) and pressed keys.
   *
   * @param {object} currentPosition { x, y, facing }
   * @param {number} deltaTimeSeconds
   * @returns {{ moved: boolean, position: { x: number, y: number, facing: string } }}
   */
  update(currentPosition, deltaTimeSeconds) {
    if (this.keys.size === 0 || deltaTimeSeconds <= 0) {
      return { moved: false, position: currentPosition };
    }

    let dx = 0;
    let dy = 0;
    let facing = currentPosition.facing || 'down';

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      dy -= 1;
      facing = 'up';
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      dy += 1;
      facing = 'down';
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      dx -= 1;
      facing = 'left';
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      dx += 1;
      facing = 'right';
    }

    if (dx === 0 && dy === 0) {
      return { moved: false, position: currentPosition };
    }

    // Normalize diagonal movement vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = (dx / length) * this.speed * deltaTimeSeconds;
    const normalizedDy = (dy / length) * this.speed * deltaTimeSeconds;

    let targetX = currentPosition.x + normalizedDx;
    let targetY = currentPosition.y + normalizedDy;

    // Check collision for both X and Y simultaneously
    let collides = checkClientCollision(
      targetX,
      targetY,
      this.furniture,
      AVATAR_DEFAULTS.RADIUS,
      this.bounds
    );

    // If both collide, try sliding along axes (e.g. wall sliding)
    if (collides) {
      const collidesX = checkClientCollision(
        targetX,
        currentPosition.y,
        this.furniture,
        AVATAR_DEFAULTS.RADIUS,
        this.bounds
      );
      if (!collidesX) {
        targetY = currentPosition.y;
        collides = false;
      } else {
        const collidesY = checkClientCollision(
          currentPosition.x,
          targetY,
          this.furniture,
          AVATAR_DEFAULTS.RADIUS,
          this.bounds
        );
        if (!collidesY) {
          targetX = currentPosition.x;
          collides = false;
        }
      }
    }

    if (collides) {
      return { moved: false, position: currentPosition };
    }

    const newPosition = {
      x: Number(targetX.toFixed(2)),
      y: Number(targetY.toFixed(2)),
      facing
    };

    return { moved: true, position: newPosition };
  }
}

