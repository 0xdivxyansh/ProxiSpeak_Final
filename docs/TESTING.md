# Final Proxispeak - Automated Testing Guide

This project includes automated testing suites across all layers.

---

## 1. Test Overview

| Test Suite | Framework | Scope | Location |
|---|---|---|---|
| Unit Tests (Backend) | Vitest | Coordinates, Math, Collision, Occlusion, Validation | `backend/src/tests/unit/` |
| Unit Tests (Frontend) | Vitest + JSDOM | Canvas math, Web Audio attenuation, Panning | `frontend/src/tests/` |
| Integration Tests | Vitest + Supertest + Socket.IO Client | REST API, MongoDB $near/$geoWithin queries, Socket events | `backend/src/tests/integration/` |
| Dual-Instance Redis | Vitest + Socket.IO | 2 backend instances communicating over Redis adapter | `backend/src/tests/integration/redis-adapter.test.js` |
| Performance Benchmark | Node.js | Proximity calculation latency & p95 measurements | `tests/performance/proximity-benchmark.js` |
| End-to-End Tests | Playwright | Dual browser contexts, movement sync, audio state | `tests/e2e/` |

---

## 2. Running Test Commands

### Run All Unit and Integration Tests
```powershell
npm run test
```

### Run Unit Tests Only
```powershell
npm run test:unit
```

### Run Backend Integration Tests (Real MongoDB & Redis)
```powershell
npm run test:integration
```

### Run Proximity Performance Benchmark (< 20ms faculty target)
```powershell
npm run test:performance
```

### Run End-to-End Playwright Tests (Dual Browser Contexts)
```powershell
npm run test:e2e
```

### Run Complete Verification Suite
```powershell
npm run verify
```
