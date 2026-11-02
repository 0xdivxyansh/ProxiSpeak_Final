# Final Proxispeak - WebRTC & Web Audio Architecture

## 1. WebRTC Peer-to-Peer Mesh

ProxiSpeak implements a true peer-to-peer WebRTC audio mesh. Audio streams flow directly between browsers; audio bytes are never routed through Socket.IO or stored on any server.

### 1.1 Perfect Negotiation Pattern
To handle simultaneous offers without collisions (glare) when two users step toward each other at the same instant, ProxiSpeak implements the W3C Recommended "Perfect Negotiation" pattern:
- **Polite Peer**: Upon glare, yields and accepts the incoming offer. Assigned when `localUserId < remoteUserId` (or `localSocketId < remoteSocketId`).
- **Impolite Peer**: Ignores incoming offers during collision and waits for the polite peer to accept its original offer.
- Flags tracked per peer: `makingOffer`, `ignoreOffer`, `isSettingRemoteAnswerPending`.

### 1.2 Proximity Trigger & Teardown Lifecycle
1. When distance <= 100px: Server emits `proximity:update` with `inRange: true`.
2. The client checks if a peer connection already exists. If not, creates `RTCPeerConnection`, adds local audio tracks, and initiates negotiation.
3. When distance > 115px (100px + 15px hysteresis): Server emits `proximity:update` with `inRange: false`.
4. The client initiates graceful teardown:
   - Disconnects Web Audio nodes.
   - Closes `RTCPeerConnection`.
   - Cleans up peer map entry.

---

## 2. Web Audio API Processing Graph

Every incoming WebRTC audio track is routed through an independent Web Audio API graph:

```
[Remote MediaStreamTrack]
         |
         v
[MediaStreamAudioSourceNode]
         |
         v
  [StereoPannerNode]  <--- Pan (-0.95 to +0.95) based on (peerX - localX)
         |
         v
     [GainNode]       <--- Gain (0.0 to 1.0) modulated by distance & occlusion
         |
         v
[AudioContext.destination] (Speakers/Headphones)
```

### 2.1 Distance Attenuation Formula
We use an inverse distance roll-off curve clamped smoothly to 0.0 at the boundary:
```javascript
function calculateDistanceGain(distance, maxRadius = 100) {
  if (distance >= maxRadius) return 0.0;
  if (distance <= 15) return 1.0; // Close speaking zone

  // Normalized distance in [0, 1]
  const normalized = (distance - 15) / (maxRadius - 15);
  // Smooth quadratic ease-out attenuation
  const gain = Math.pow(1 - normalized, 1.5);
  return Math.max(0.0, Math.min(1.0, gain));
}
```

### 2.2 Stereo Panning Calculation
Stereo panning positions the speaker horizontally relative to the listener's perspective:
```javascript
function calculateStereoPan(listenerX, speakerX, maxRadius = 100) {
  const dx = speakerX - listenerX;
  // Normalized pan from -1.0 (far left) to +1.0 (far right)
  const pan = dx / maxRadius;
  // Clamp to safe range to avoid sudden hard clicks
  return Math.max(-0.95, Math.min(0.95, pan));
}
```

### 2.3 Acoustic Sound Occlusion
When a physical acoustic obstacle (wall or sound barrier partition) intersects the direct line of sight between listener and speaker, sound waves are diffracted and attenuated:
```javascript
// Obstacle attenuation factor: 0.25 (75% volume reduction)
const occlusionFactor = hasObstacle ? 0.25 : 1.0;
const finalGain = baseDistanceGain * occlusionFactor;
```
Smooth transitions are applied via `gainNode.gain.setTargetAtTime(finalGain, audioContext.currentTime, 0.05)` to eliminate audible clicks.

---

## 3. Microphone & Autoplay Policy Handling
- Microphones are accessed via `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })`.
- `AudioContext` autoplay restrictions in modern browsers are resolved by resuming the context upon the first user interaction (clicking "Join Office" or pressing a key).
