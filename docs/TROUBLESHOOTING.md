# Final Proxispeak - Troubleshooting & FAQs

## 1. MongoDB Connection Issues
- **Symptom**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: MongoDB service is not started on the host machine.
- **Fix**: Run `Start-Service MongoDB` in PowerShell as Administrator or start MongoDB container via `docker compose up -d mongodb`.

---

## 2. Redis Connection Issues
- **Symptom**: `[Redis] Connection failed: ECONNREFUSED 127.0.0.1:6379`
- **Behavior**: The backend enters graceful standalone fallback mode if `REDIS_REQUIRED=false`.
- **Fix**: To enable Redis adapter for cross-instance sync, start Redis via WSL (`wsl -d Ubuntu-22.04 -u root -e service redis-server start`) or Docker (`docker compose up -d redis`).

---

## 3. WebRTC Microphone Access Errors
- **Symptom**: `NotAllowedError: Permission denied` or `NotFoundError: Requested device not found`
- **Cause**: Browser microphone permissions blocked or no physical microphone plugged in.
- **Fix**:
  - Click the lock/site settings icon in the browser address bar and set Microphone to "Allow".
  - If testing without hardware, enable Chrome fake media flags (`--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`).

---

## 4. Web Audio Autoplay Policy
- **Symptom**: Remote users are nearby but no sound is heard until clicked.
- **Cause**: Modern browsers suspend `AudioContext` until an initial user gesture.
- **Fix**: Click anywhere on the Canvas workspace or toggle mute/unmute to trigger context resume.

---

## 5. Port Conflicts
- **Symptom**: `EADDRINUSE: address already in use :::5000`
- **Fix**: Check running processes on port 5000 (`Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess`) or change `PORT=5001` in `.env`.
