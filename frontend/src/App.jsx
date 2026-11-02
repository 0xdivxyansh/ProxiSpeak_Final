/**
 * Final Proxispeak - Main React Application Component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JoinScreen } from './components/rooms/JoinScreen.jsx';
import { Header } from './components/common/Header.jsx';
import { WorkspaceCanvas } from './canvas/WorkspaceCanvas.jsx';
import { Workspace3D } from './canvas/Workspace3D.jsx';
import { AudioControls } from './components/audio/AudioControls.jsx';
import { UserListSidebar } from './components/workspace/UserListSidebar.jsx';

import { socketClient } from './services/socket/socketClient.js';
import { audioContextService } from './services/audio/audioContextService.js';
import { spatialAudioEngine } from './services/audio/spatialAudioEngine.js';
import { PeerManager } from './services/webrtc/peerManager.js';

import './styles/index.css';
import './styles/App.css';
import './styles/ui.css';

export function App() {
  const [joined, setJoined] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [layout, setLayout] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [proximityPeerIds, setProximityPeerIds] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '2d' | '3d' - Default to 3D Virtual House
  const [fps, setFps] = useState(60);

  const peerManagerRef = useRef(null);

  // Initialize WebRTC PeerManager
  if (!peerManagerRef.current) {
    peerManagerRef.current = new PeerManager(socketClient);
  }

  // Handle joining a room from the landing screen
  const handleJoin = async ({ displayName, roomId, color }) => {
    // 1. Request microphone access immediately
    const micResult = await audioContextService.requestMicrophone();
    if (!micResult.success) {
      console.warn('[App] Entering room without microphone access:', micResult.error);
    }

    // 2. Connect to Socket.IO server
    socketClient.connect();

    // 3. Emit join request
    socketClient.joinRoom(roomId, displayName, color);
  };

  // Handle leaving the virtual room
  const handleLeave = () => {
    socketClient.leaveRoom();
    peerManagerRef.current.closeAll();
    spatialAudioEngine.clear();
    audioContextService.stop();

    setJoined(false);
    setLocalUser(null);
    setRoom(null);
    setLayout(null);
    setRemoteUsers([]);
    setProximityPeerIds(new Set());
  };

  // Handle microphone mute toggle
  const handleToggleMute = () => {
    const nextMuted = audioContextService.toggleMute();
    setIsMuted(nextMuted);
    if (localUser) {
      setLocalUser((prev) => ({ ...prev, isMuted: nextMuted }));
      socketClient.sendMute(nextMuted);
    }
  };

  // Handle explicit microphone request if initially denied/deferred
  const handleRequestMic = async () => {
    const res = await audioContextService.requestMicrophone();
    if (res.success && peerManagerRef.current) {
      setIsMuted(false);
    }
  };

  // Throttled movement emission to backend
  const lastMoveSentRef = useRef(0);
  const handleLocalMove = useCallback((x, y, facing) => {
    setLocalUser((prev) => (prev ? { ...prev, x, y, facing } : null));

    const now = performance.now();
    // Throttle socket movement updates to max 30-40 Hz to minimize bandwidth
    if (now - lastMoveSentRef.current >= 28) {
      socketClient.sendMove(x, y, facing);
      lastMoveSentRef.current = now;
    }
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    const unsubRoomState = socketClient.on('room:state', (data) => {
      console.log('[App] Received room state:', data);
      setLocalUser(data.self);
      setRoom(data.room);
      setLayout(data.layout);
      setRemoteUsers(data.users || []);
      setJoined(true);

      if (data.self?.userId && peerManagerRef.current) {
        peerManagerRef.current.setLocalUserId(data.self.userId);
      }
    });

    const unsubUserJoined = socketClient.on('user:joined', (user) => {
      console.log('[App] User joined room:', user);
      setRemoteUsers((prev) => {
        if (prev.some((u) => u.userId === user.userId)) return prev;
        return [...prev, user];
      });
    });

    const unsubUserLeft = socketClient.on('user:left', ({ userId }) => {
      console.log('[App] User left room:', userId);
      setRemoteUsers((prev) => prev.filter((u) => u.userId !== userId));
      setProximityPeerIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      if (peerManagerRef.current) {
        peerManagerRef.current.closePeer(userId);
      }
    });

    const unsubUserMoved = socketClient.on('user:moved', (payload) => {
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.userId === payload.userId
            ? { ...u, x: payload.x, y: payload.y, facing: payload.facing }
            : u
        )
      );
    });

    const unsubPosCorrection = socketClient.on('user:position_correction', (correction) => {
      console.warn('[App] Position corrected by server:', correction);
      setLocalUser((prev) => (prev ? { ...prev, x: correction.x, y: correction.y } : null));
    });

    const unsubProximity = socketClient.on('proximity:update', (update) => {
      const { peerId, inRange, isPolite } = update;

      setProximityPeerIds((prev) => {
        const next = new Set(prev);
        if (inRange) {
          next.add(peerId);
        } else {
          next.delete(peerId);
        }
        return next;
      });

      if (inRange) {
        // Automatically establish WebRTC peer connection when in range (<= 100px)
        if (peerManagerRef.current && !peerManagerRef.current.hasPeer(peerId)) {
          peerManagerRef.current.createPeerConnection(peerId, isPolite);
        }
      } else {
        // Close audio connection when user leaves range (> 115px)
        if (peerManagerRef.current) {
          peerManagerRef.current.closePeer(peerId);
        }
      }
    });

    const unsubUserMuted = socketClient.on('user:muted', ({ userId, isMuted: mutedState }) => {
      setRemoteUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, isMuted: mutedState } : u))
      );
    });

    // WebRTC Signaling Handlers
    const unsubOffer = socketClient.on('webrtc:offer', ({ senderUserId, sdp }) => {
      if (peerManagerRef.current) {
        peerManagerRef.current.handleOffer(senderUserId, sdp);
      }
    });

    const unsubAnswer = socketClient.on('webrtc:answer', ({ senderUserId, sdp }) => {
      if (peerManagerRef.current) {
        peerManagerRef.current.handleAnswer(senderUserId, sdp);
      }
    });

    const unsubIce = socketClient.on('webrtc:ice', ({ senderUserId, candidate }) => {
      if (peerManagerRef.current) {
        peerManagerRef.current.handleIceCandidate(senderUserId, candidate);
      }
    });

    return () => {
      unsubRoomState();
      unsubUserJoined();
      unsubUserLeft();
      unsubUserMoved();
      unsubPosCorrection();
      unsubProximity();
      unsubUserMuted();
      unsubOffer();
      unsubAnswer();
      unsubIce();
    };
  }, []);

  if (!joined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="app-root">
      <Header
        roomName={room?.name || 'Virtual Office'}
        userCount={remoteUsers.length + 1}
        localUser={localUser}
        fps={fps}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === '2d' ? '3d' : '2d'))}
        onLeave={handleLeave}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <main className="workspace-container">
        {viewMode === '3d' ? (
          <Workspace3D
            localUser={localUser}
            remoteUsers={remoteUsers}
            layout={layout}
            proximityPeerIds={proximityPeerIds}
            onLocalMove={handleLocalMove}
            fpsReport={setFps}
          />
        ) : (
          <WorkspaceCanvas
            localUser={localUser}
            remoteUsers={remoteUsers}
            layout={layout}
            proximityPeerIds={proximityPeerIds}
            onLocalMove={handleLocalMove}
            fpsReport={setFps}
          />
        )}

        <AudioControls
          isMuted={isMuted}
          proximityCount={proximityPeerIds.size}
          onToggleMute={handleToggleMute}
          onRequestMic={handleRequestMic}
        />

        <UserListSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          localUser={localUser}
          remoteUsers={remoteUsers}
          proximityPeerIds={proximityPeerIds}
        />
      </main>
    </div>
  );
}

export default App;

