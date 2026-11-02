# Final Proxispeak - Windows Setup and Launch Guide

## 1. Prerequisites

- **Operating System**: Windows 10/11
- **Node.js**: v18.0.0 or higher (Tested and verified with Node.js v22.17.1)
- **MongoDB**: MongoDB Community Server 7.0+ (Running on Windows service or Docker at `localhost:27017`)
- **Redis**: Redis 6.0+ (Running via WSL2 or Docker at `localhost:6379`)
- **Browsers**: Chrome, Edge, or Firefox with WebRTC and microphone permissions enabled

---

## 2. Directory Verification

Ensure you are in the target directory:
```powershell
Set-Location 'D:\Final Proxispeak'
```

---

## 3. Environment Configuration

Copy the example environment configuration into `.env`:
```powershell
Copy-Item .env.example .env
```
Ensure that:
- `MONGODB_URI=mongodb://127.0.0.1:27017/final_proxispeak`
- `REDIS_URL=redis://127.0.0.1:6379`
- `PORT=5000`
- `FRONTEND_URL=http://localhost:5173`

---

## 4. Starting Database & Redis Services

### Option A: Local Windows Services (Recommended)
1. **MongoDB**: Start the MongoDB Windows Service if not already running:
   ```powershell
   Start-Service MongoDB
   ```
2. **Redis (WSL2)**:
   ```powershell
   wsl -d Ubuntu-22.04 -u root -e service redis-server start
   ```
3. **Verify Connectivity**:
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
   Test-NetConnection -ComputerName 127.0.0.1 -Port 6379
   ```

### Option B: Docker Compose
```powershell
docker compose up -d
```

---

## 5. Dependency Installation & Layout Seeding

1. **Install Dependencies Across All Workspaces**:
   ```powershell
   npm run install:all
   ```

2. **Seed Default Office Layout**:
   ```powershell
   npm run seed
   ```

---

## 6. Running the Development Servers

To start both Backend and Frontend concurrently:
```powershell
npm run dev
```

Or start them in separate PowerShell terminals:
- **Terminal 1 (Backend)**:
  ```powershell
  npm run dev:backend
  ```
- **Terminal 2 (Frontend)**:
  ```powershell
  npm run dev:frontend
  ```

---

## 7. Accessing the Application

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
