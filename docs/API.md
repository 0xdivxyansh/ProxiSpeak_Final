# Final Proxispeak - REST API Specification

All endpoints return JSON and use standard HTTP status codes.

Base URL: `http://localhost:5000/api`

---

## 1. System Health

### `GET /health`
Returns the operational health and readiness of the backend, MongoDB database, and Redis cache.

- **Headers**: None
- **Response**: `200 OK` (when fully operational or in resilient fallback mode)

```json
{
  "status": "healthy",
  "uptime": 124.5,
  "timestamp": "2026-11-02T12:00:00.000Z",
  "services": {
    "mongodb": {
      "status": "connected",
      "readyState": 1
    },
    "redis": {
      "status": "connected",
      "mode": "redis-adapter"
    }
  },
  "config": {
    "nodeEnv": "development",
    "proximityRadius": 100,
    "workspaceDimensions": { "width": 1600, "height": 1000 }
  }
}
```

---

## 2. Rooms

### `GET /rooms`
Returns a list of active virtual office rooms along with participant counts.

- **Response**: `200 OK`

```json
[
  {
    "roomId": "main-hall",
    "name": "Global Innovation Hub",
    "layoutId": "default-office-layout",
    "userCount": 4,
    "maxCapacity": 50,
    "createdAt": "2026-11-02T10:00:00.000Z"
  }
]
```

### `POST /rooms`
Creates a new virtual office room.

- **Request Body**:
```json
{
  "roomId": "engineering-pod",
  "name": "Engineering Workspace",
  "layoutId": "default-office-layout",
  "maxCapacity": 25
}
```
- **Validation**:
  - `roomId`: alphanumeric string, dashes and underscores, 3-40 characters.
  - `name`: string, 1-60 characters.
  - `layoutId`: string, must match an existing layout.
- **Responses**:
  - `201 Created`
  - `400 Bad Request` (Validation error)
  - `409 Conflict` (Room ID already exists)

### `GET /rooms/:roomId`
Returns detailed information for a specific room.

- **Response**: `200 OK`
```json
{
  "roomId": "engineering-pod",
  "name": "Engineering Workspace",
  "layoutId": "default-office-layout",
  "userCount": 2,
  "maxCapacity": 25,
  "layout": {
    "dimensions": { "width": 1600, "height": 1000 },
    "furnitureCount": 18
  }
}
```
- **Errors**: `404 Not Found`

### `GET /rooms/:roomId/users`
Returns the active users connected to a specific room.

- **Response**: `200 OK`
```json
[
  {
    "userId": "user_xyz789",
    "displayName": "Alice",
    "color": "#38bdf8",
    "x": 800,
    "y": 880,
    "facing": "down",
    "isMuted": false,
    "joinedAt": "2026-11-02T10:15:00.000Z"
  }
]
```

---

## 3. Layouts & Furniture

### `GET /layouts`
Returns all persisted office layouts.

- **Response**: `200 OK`
```json
[
  {
    "layoutId": "default-office-layout",
    "name": "Standard Tech Innovation Hub",
    "dimensions": { "width": 1600, "height": 1000 },
    "furnitureCount": 18
  }
]
```

### `GET /layouts/:layoutId`
Retrieves full layout details including all furniture, solid collision boundaries, and acoustic occlusion obstacles.

- **Response**: `200 OK`
```json
{
  "layoutId": "default-office-layout",
  "name": "Standard Tech Innovation Hub",
  "dimensions": { "width": 1600, "height": 1000 },
  "spawnPoint": { "x": 800, "y": 880 },
  "furniture": [
    {
      "id": "conf_wall_west",
      "type": "wall",
      "label": "Conference Room West Wall",
      "x": 100,
      "y": 100,
      "width": 20,
      "height": 350,
      "isSolid": true,
      "isAcousticObstacle": true,
      "color": "#475569"
    }
  ]
}
```

---

## 4. Geospatial Diagnostics

### `GET /rooms/:roomId/proximity-query`
Diagnostic endpoint to query nearby users in a room using MongoDB `$near` geospatial operators.

- **Query Parameters**:
  - `x`: number (Planar pixel X)
  - `y`: number (Planar pixel Y)
  - `radius`: number (optional, defaults to 100 pixels)
- **Response**: `200 OK`
```json
{
  "origin": { "x": 800, "y": 880 },
  "radiusPixels": 100,
  "usersFound": 2,
  "results": [
    {
      "userId": "user_abc123",
      "displayName": "Bob",
      "distancePixels": 42.5,
      "x": 830,
      "y": 850
    }
  ]
}
```
