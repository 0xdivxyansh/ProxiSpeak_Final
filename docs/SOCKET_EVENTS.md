# Final Proxispeak - Socket.IO Events Specification

This document details the real-time event contract between the client and server.

---

## 1. Room Membership Events

### `room:join`
- **Direction**: Client -> Server
- **Payload**:
  ```json
  {
    "roomId": "main-hall",
    "displayName": "Ada Lovelace",
    "color": "#38bdf8"
  }
  ```
- **Required Fields**: `roomId`, `displayName`
- **Validation**:
  - `roomId`: string, 3-40 chars, regex `^[a-zA-Z0-9_-]+$`
  - `displayName`: string, 1-30 chars, sanitized against XSS
  - `color`: valid hex color string or omitted (server assigns random palette color)
- **Authorization**: Open to all connecting sessions; user bound to socket session.
- **Acknowledgement Callback**: `(response) => void`
  - Success: `{ success: true, user: { userId, displayName, color, x, y, facing, isMuted } }`
  - Failure: `{ success: false, error: "Validation failed or room full" }`
- **Failure Behavior**: Emits error acknowledgement, does not join socket room.

### `room:state`
- **Direction**: Server -> Client (Direct to joining socket)
- **Payload**:
  ```json
  {
    "room": { "roomId": "main-hall", "name": "Global Hub", "layoutId": "default-office-layout" },
    "users": [
      { "userId": "usr_1", "displayName": "Bob", "color": "#34d399", "x": 500, "y": 400, "facing": "down", "isMuted": false }
    ],
    "layout": { "dimensions": { "width": 1600, "height": 1000 }, "furniture": [...] }
  }
  ```
- **Trigger**: Emitted immediately upon successful room join.

### `user:joined`
- **Direction**: Server -> Client (Broadcast to room except joining user)
- **Payload**:
  ```json
  {
    "user": { "userId": "usr_2", "displayName": "Ada", "color": "#38bdf8", "x": 800, "y": 880, "facing": "down", "isMuted": false }
  }
  ```

### `room:leave`
- **Direction**: Client -> Server
- **Payload**: `{}`
- **Behavior**: Removes user from room, cleans up proximity pairs, closes peer connections, broadcasts `user:left`.

### `user:left`
- **Direction**: Server -> Client (Broadcast to room)
- **Payload**: `{ "userId": "usr_2" }`

---

## 2. Movement & Spatial Events

### `user:move`
- **Direction**: Client -> Server
- **Payload**:
  ```json
  {
    "x": 810.5,
    "y": 875.2,
    "facing": "up",
    "timestamp": 1714651200000
  }
  ```
- **Required Fields**: `x`, `y`, `facing`, `timestamp`
- **Validation**:
  - `x`: finite number within `[0, WORKSPACE_WIDTH]`
  - `y`: finite number within `[0, WORKSPACE_HEIGHT]`
  - `facing`: `'up' | 'down' | 'left' | 'right'`
  - Velocity delta check: `distance / deltaTime <= MAX_ALLOWED_PPS (350)`
  - Obstacle collision check: avatar circle `(x, y, radius=18)` must not overlap solid furniture
- **Authorization**: User must be in an active room.
- **Failure Behavior**: If position violates speed or collision, server emits `user:position_correction` with valid coordinates.
- **Success Broadcast**: Dispatches `user:moved` to room peers.

### `user:moved`
- **Direction**: Server -> Client (Broadcast to other room members)
- **Payload**:
  ```json
  {
    "userId": "usr_2",
    "x": 810.5,
    "y": 875.2,
    "facing": "up"
  }
  ```

### `user:position_correction`
- **Direction**: Server -> Client (Direct to offending client)
- **Payload**:
  ```json
  {
    "x": 800.0,
    "y": 880.0,
    "reason": "COLLISION_DETECTED"
  }
  ```

---

## 3. Geospatial Proximity Events

### `proximity:update`
- **Direction**: Server -> Client (Direct to affected peers)
- **Payload**:
  ```json
  {
    "peerId": "usr_1",
    "inRange": true,
    "distance": 84.2,
    "isPolite": true
  }
  ```
- **Description**: Emitted when distance between two room members transitions below 100px (activation) or above 115px (hysteresis disconnect).
- **`isPolite` Negotiation Flag**: Calculated as `socket.id > peerSocket.id` to guarantee unambiguous perfect negotiation role assignment.

---

## 4. WebRTC Signaling Events

### `webrtc:offer`
- **Direction**: Bidirectional (Client -> Server -> Target Client)
- **Payload**:
  ```json
  {
    "targetUserId": "usr_1",
    "sdp": { "type": "offer", "sdp": "v=0\r\no=..." }
  }
  ```
- **Required Fields**: `targetUserId`, `sdp`
- **Validation**:
  - Sender and Target must belong to the same room.
  - Sender and Target must currently be within the authorized proximity radius.
  - SDP structure must have `type === 'offer'` and string length < 64KB.
- **Authorization**: Server verifies proximity state before routing.
- **Failure Behavior**: Dropped with error logged; client notified if unauthorized.

### `webrtc:answer`
- **Direction**: Bidirectional (Client -> Server -> Target Client)
- **Payload**:
  ```json
  {
    "targetUserId": "usr_2",
    "sdp": { "type": "answer", "sdp": "v=0\r\no=..." }
  }
  ```
- **Validation**: Sender and target must be within authorized proximity.
- **Failure Behavior**: Dropped if unauthorized.

### `webrtc:ice`
- **Direction**: Bidirectional (Client -> Server -> Target Client)
- **Payload**:
  ```json
  {
    "targetUserId": "usr_1",
    "candidate": {
      "candidate": "candidate:...",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
  ```
- **Validation**: Valid candidate object, target in same room and within range.

---

## 5. Audio & State Events

### `user:mute`
- **Direction**: Client -> Server
- **Payload**:
  ```json
  { "isMuted": true }
  ```
- **Validation**: Boolean `isMuted`.
- **Broadcast**: Emits `user:muted` to all room members.

### `user:muted`
- **Direction**: Server -> Client (Broadcast)
- **Payload**:
  ```json
  {
    "userId": "usr_1",
    "isMuted": true
  }
  ```
