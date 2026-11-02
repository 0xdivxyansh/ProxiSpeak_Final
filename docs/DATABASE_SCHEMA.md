# Final Proxispeak - Database Schema Specification

This document details MongoDB collections, Mongoose schemas, and geospatial indexing.

---

## 1. Collections

1. `rooms`: Virtual office rooms with assigned layouts and capacity.
2. `layouts`: Office layouts with dimensional bounds, spawn points, and furniture obstacles.
3. `sessions`: Active user spatial sessions containing GeoJSON Point coordinates with `2dsphere` indexes.

---

## 2. Mongoose Schemas

### 2.1 Room Schema (`models/Room.js`)

```javascript
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  layoutId: {
    type: String,
    required: true,
    ref: 'Layout'
  },
  maxCapacity: {
    type: Number,
    default: 50,
    min: 2,
    max: 200
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
```

### 2.2 Layout Schema (`models/Layout.js`)

```javascript
const furnitureSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['wall', 'meeting_table', 'desk', 'sofa', 'coffee_table', 'plant', 'whiteboard', 'acoustic_partition', 'water_cooler'],
    required: true
  },
  label: { type: String, default: '' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  isSolid: { type: Boolean, default: true },
  isAcousticObstacle: { type: Boolean, default: false },
  color: { type: String, default: '#334155' }
}, { _id: false });

const layoutSchema = new mongoose.Schema({
  layoutId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  dimensions: {
    width: { type: Number, required: true, default: 1600 },
    height: { type: Number, required: true, default: 1000 }
  },
  spawnPoint: {
    x: { type: Number, default: 800 },
    y: { type: Number, default: 880 }
  },
  furniture: [furnitureSchema]
}, { timestamps: true });
```

### 2.3 User Session Schema (`models/UserSession.js`)

```javascript
const userSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  socketId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  displayName: { type: String, required: true },
  color: { type: String, required: true },
  // GeoJSON Point for MongoDB 2dsphere indexing
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  // Planar pixel coordinates for 1:1 office display
  planarPosition: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  facing: {
    type: String,
    enum: ['up', 'down', 'left', 'right'],
    default: 'down'
  },
  isMuted: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Compound 2dsphere index for room-isolated geospatial queries
userSessionSchema.index({ roomId: 1, location: '2dsphere' });
```

---

## 3. Geospatial Query Implementations

### 3.1 Proximity Retrieval with `$near`
Find all users in a specific room within `radiusMeters`:
```javascript
const nearbySessions = await UserSession.find({
  roomId: targetRoomId,
  userId: { $ne: currentUserId },
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [targetLng, targetLat]
      },
      $maxDistance: maxDistanceMeters
    }
  }
}).lean();
```

### 3.2 Bounded Region Filtering with `$geoWithin`
Find all users located inside an office zone or bounding polygon:
```javascript
const usersInZone = await UserSession.find({
  roomId: targetRoomId,
  location: {
    $geoWithin: {
      $box: [
        [bottomLeftLng, bottomLeftLat],
        [topRightLng, topRightLat]
      ]
    }
  }
}).lean();
```
