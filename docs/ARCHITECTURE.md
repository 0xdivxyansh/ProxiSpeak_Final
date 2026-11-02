# Final Proxispeak - Architecture Specification

## 1. System Overview

**ProxiSpeak** is a geospatial proximity audio ecosystem for 2D virtual workspaces. It enables real-time avatar movement across customizable office floors, automatic establishment and teardown of peer-to-peer WebRTC audio streams when users enter or leave proximity boundaries (100 pixels), distance-based acoustic gain attenuation, directional stereo panning, and physical sound occlusion through walls.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  |   HTML5 Canvas     |     |   WebRTC PeerConn   |     |   Web Audio API      |  |
|  | - 60 FPS Render    |     | - P2P Mesh Audio    |     | - Distance Atten     |  |
|  | - Interpolation    | <-> | - Perfect Negot     | <-> | - Stereo Panning     |  |
|  | - Local Prediction |     | - Auto Teardown     |     | - Sound Occlusion    |  |
|  +--------------------+     +---------------------+     +----------------------+  |
|            ^                           ^                                          |
|            |                           |                                          |
|            +-------------+-------------+                                          |
|                          | Socket.IO Transport                                    |
+--------------------------|--------------------------------------------------------+
                           v
+-----------------------------------------------------------------------------------+
|                                BACKEND TIER                                       |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  | Express REST API   |     |  Socket.IO Engine   |     | Proximity & Physics  |  |
|  | - Rooms & Layouts  |     | - Signaling Server  |     | - Planar Proximity   |  |
|  | - Health Probes    | <-> | - State Broadcast   | <-> | - AABB Collision     |  |
|  | - Rate Limiting    |     | - Session Tracking  |     | - Authoritative Move |  |
|  +--------------------+     +---------------------+     +----------------------+  |
|            |                           |                                          |
|            v                           v                                          |
|  +--------------------+     +---------------------+                               |
|  | Mongoose Models    |     | Socket.IO Redis     |                               |
|  | - GeoJSON 2dsphere |     | - Cluster Pub/Sub   |                               |
|  +--------------------+     +---------------------+                               |
+------------|---------------------------|------------------------------------------+
             v                           v
+-----------------------+     +-----------------------+
|  MongoDB Database     |     |  Redis Cache/PubSub   |
| - Layout persistence  |     | - Socket Adapter      |
| - 2dsphere indexes    |     | - Multi-instance sync |
| - $near / $geoWithin  |     | - Ephemeral rooms     |
+-----------------------+     +-----------------------+
```

---

## 2. Component Breakdown

### 2.1 Frontend (React + Vite + HTML5 Canvas)
- **HTML5 Canvas Workspace**: Renders the 2D floor grid, solid furniture obstacles, acoustic barriers, and dynamic user avatars. Implements an independent `requestAnimationFrame` render loop isolated from React component state changes, ensuring 60 FPS rendering without React re-render penalties.
- **Client-Side Interpolation & Prediction**: Uses local input prediction for the active user avatar with immediate responsiveness, combined with linear interpolation (LERP) for remote peers to prevent visual jitter over network latency.
- **WebRTC Voice Service**: Orchestrates P2P mesh audio using `RTCPeerConnection` with the "perfect negotiation" pattern (polite vs. impolite peers based on lexicographical user ID comparison). Automatically creates offers when peers cross into the 100px proximity radius and closes connections when exiting.
- **Spatial Audio Graph**: Directly wires incoming `MediaStreamTrack` nodes into `AudioContext` -> `MediaStreamAudioSourceNode` -> `StereoPannerNode` -> `GainNode` -> `Destination`. Computes smooth audio attenuation curves and acoustic obstacle occlusion.

### 2.2 Backend (Node.js + Express + Socket.IO)
- **Authoritative Movement & Physics**: The server validates all movement vector deltas, enforces maximum speed limits (anti-teleportation), and runs circle-to-AABB collision checks against the room layout furniture. Invalid coordinates are rejected and corrected.
- **Geospatial Proximity Subsystem**: Computes exact Euclidean distances on the virtual planar office coordinate plane. Also synchronizes positions with MongoDB documents indexed with `2dsphere` to exercise native `$near` and `$geoWithin` queries.
- **Signaling Gateway**: Authorizes and validates all SDP offers, answers, and ICE candidate exchanges over Socket.IO. Rejects signaling messages between unauthorized rooms or between users beyond proximity thresholds.
- **Persistence & REST API**: Express routes providing room discovery, layout inspection, and health readiness monitoring (MongoDB and Redis connection statuses).

### 2.3 Shared Infrastructure
- **MongoDB**: Durable store for room templates, layout geometry, furniture dimensions, and spatial coordinates. Employs `2dsphere` indexes on GeoJSON Point positions.
- **Redis & Adapter**: Powers the `@socket.io/redis-adapter` for multi-instance horizontal scaling. Dispatches movement updates and signaling payloads across distributed node instances listening to shared Redis channels.

---

## 3. Data Flow

### 3.1 Movement & Spatial Sync
1. User presses WASD/Arrow keys.
2. Local Canvas predicts movement and updates display immediately.
3. Socket.IO emits throttled `user:move` payload `{ x, y, facing }` with client timestamp.
4. Server validates speed delta against `MAX_ALLOWED_PPS` and performs collision check against furniture.
5. If valid, server updates in-memory/Redis session, pushes coordinates to MongoDB, recalculates proximity relationships, and broadcasts `user:moved` to room peers.
6. If invalid (collision or excessive speed), server emits `user:position_correction` with authoritative coordinates.

### 3.2 Proximity & WebRTC Lifecycle
1. Server proximity engine detects distance between Peer A and Peer B <= 100px.
2. Server emits `proximity:update` to both peers: `{ peerId, inRange: true, distance }`.
3. The polite peer initiates WebRTC offer with local microphone audio track.
4. Server validates that Peer A and Peer B are in the same room and within range before relaying `webrtc:offer`.
5. Peer B accepts offer, generates answer, relayed via server `webrtc:answer`.
6. ICE candidates are exchanged through `webrtc:ice`.
7. Direct P2P audio flows; client spatial engine modulates Gain and Stereo Panner as coordinates move.
8. When distance exceeds boundary (> 115px hysteresis), server emits `proximity:update` with `inRange: false`.
9. Peer connection is closed, remote audio nodes are disconnected and garbage-collected.
