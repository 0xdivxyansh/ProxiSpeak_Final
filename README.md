# Final Proxispeak

> **ProxiSpeak: Geospatial Proximity Audio Ecosystem**  
> A shared 2D virtual office in which users navigate customized workspaces, see colleagues move in real-time, and converse seamlessly through automatic peer-to-peer WebRTC spatial audio.

---

## Architecture Highlights

- **Planar & Spherical Geospatial Engine**: Virtual office coordinate modeling backed by Euclidean distance mathematics and native MongoDB `2dsphere` indexes (`$near` and `$geoWithin`).
- **WebRTC Mesh Voice Chat**: Automated connection lifecycle triggered at 100px proximity, with perfect negotiation collision avoidance and direct browser-to-browser media streaming.
- **Web Audio API Spatial Sound**: Smooth distance-based volume attenuation, directional stereo panning, and physical acoustic occlusion through office walls and furniture.
- **HTML5 Canvas 2D Engine**: 60 FPS workspace rendering with client-side prediction, LERP remote interpolation, and AABB collision detection.
- **Redis Multi-Instance Scalability**: Horizontal scaling via `@socket.io/redis-adapter` for synchronized cross-node message routing.
- **Robust REST API**: Modular Express endpoints for rooms, layouts, and system health readiness.

---

## Quick Start on Windows

### 1. Verify Prerequisites
- Node.js v18+ (verified on v22.17.1)
- MongoDB running on `127.0.0.1:27017`
- Redis running on `127.0.0.1:6379`

### 2. Install Dependencies
```powershell
npm run install:all
```

### 3. Seed Default Layout
```powershell
npm run seed
```

### 4. Start Development Servers
```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Testing & Quality Assurance

- **Unit Tests**: `npm run test:unit`
- **Integration Tests (MongoDB + Redis)**: `npm run test:integration`
- **Performance Benchmark (< 20ms)**: `npm run test:performance`
- **End-to-End Dual-Browser Tests**: `npm run test:e2e`
- **Full Verification Suite**: `npm run verify`

---

## Documentation Index

- [System Architecture](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [Socket.IO Events Contract](docs/SOCKET_EVENTS.md)
- [Database Schemas & Geospatial Indexes](docs/DATABASE_SCHEMA.md)
- [WebRTC & Web Audio Architecture](docs/WEBRTC_AUDIO.md)
- [Windows Setup Guide](docs/SETUP_WINDOWS.md)
- [Automated Testing Suite](docs/TESTING.md)
- [Troubleshooting & FAQs](docs/TROUBLESHOOTING.md)
- [Requirements Verification Matrix](docs/REQUIREMENTS_CHECKLIST.md)
- [User Guide](docs/USER_GUIDE.md)
