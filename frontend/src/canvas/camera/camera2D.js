/**
 * Final Proxispeak - 2D Smooth Following Camera
 */

export class Camera2D {
  constructor(viewportWidth = 800, viewportHeight = 600) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpFactor = 0.12; // Smooth camera damping factor
  }

  resize(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  follow(targetX, targetY, workspaceWidth = 1600, workspaceHeight = 1000) {
    // Center camera on target avatar
    let desiredX = targetX - this.viewportWidth / 2;
    let desiredY = targetY - this.viewportHeight / 2;

    // Clamp camera within workspace bounds
    const maxX = Math.max(0, workspaceWidth - this.viewportWidth);
    const maxY = Math.max(0, workspaceHeight - this.viewportHeight);

    this.targetX = Math.max(0, Math.min(maxX, desiredX));
    this.targetY = Math.max(0, Math.min(maxY, desiredY));

    // If workspace is smaller than viewport, center it
    if (workspaceWidth < this.viewportWidth) {
      this.targetX = (workspaceWidth - this.viewportWidth) / 2;
    }
    if (workspaceHeight < this.viewportHeight) {
      this.targetY = (workspaceHeight - this.viewportHeight) / 2;
    }

    // Smooth lerp
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;
  }

  snapTo(targetX, targetY, workspaceWidth = 1600, workspaceHeight = 1000) {
    this.follow(targetX, targetY, workspaceWidth, workspaceHeight);
    this.x = this.targetX;
    this.y = this.targetY;
  }
}

