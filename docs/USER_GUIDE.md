# Final Proxispeak - User Guide

## 1. Entering the Virtual Office

1. Open your browser and navigate to `http://localhost:5173`.
2. Enter your desired **Display Name** (e.g. "Dev", "Alice", "Bob").
3. Choose your preferred avatar color from the palette.
4. Select an active room from the list (e.g., `main-hall`) or enter a custom Room ID to create one.
5. Click **Join Office**.
6. When prompted by the browser, click **Allow** to enable microphone access.

---

## 2. Navigating the Workspace

- **Keyboard Movement**: Use `W`, `A`, `S`, `D` or the Arrow keys (`Up`, `Down`, `Left`, `Right`) to move your avatar.
- **Boundaries & Obstacles**: Solid desks, boardroom tables, and acoustic wall partitions will block your avatar from passing through.
- **Camera Follow**: The 2D viewport smoothly tracks your avatar as you move across the 1600x1000 pixel floor.

---

## 3. Proximity Audio Interaction

- **Visual Proximity Indicator**: When other users approach within **100 pixels**, a glowing audio aura and link will appear between your avatars.
- **Spatial Audio Experience**:
  - The voice volume increases as you get closer to a colleague and diminishes as you move further away.
  - When a colleague is to your left, their voice will pan into your left headphone/speaker.
  - If a colleague walks behind an acoustic wall or sound barrier partition, their voice is occluded and muffled.
- **Audio Disconnect**: When you move more than 115 pixels away, the peer audio connection automatically closes.

---

## 4. Audio Controls & Privacy

- **Microphone Mute**: Click the **Mute/Unmute** microphone button in the toolbar or press the `M` key. A red muted icon will appear above your avatar.
- **Leave Office**: Click the **Leave Room** button to safely disconnect, close your WebRTC channels, and release microphone hardware.
