/**
 * Final Proxispeak - WebRTC Peer Connection Manager
 *
 * Implements:
 * - Peer-to-peer audio mesh
 * - Perfect negotiation pattern (polite peer vs impolite peer)
 * - Safe offer/answer state transitions
 * - ICE candidate queuing & exchange
 * - Full cleanup on proximity exit or disconnect
 */

import { ICE_SERVERS } from '../../constants/config.js';
import { audioContextService } from '../audio/audioContextService.js';
import { spatialAudioEngine } from '../audio/spatialAudioEngine.js';

export class PeerManager {
  constructor(socketClient) {
    this.socketClient = socketClient;
    // Map<peerId, { pc, isPolite, makingOffer, ignoreOffer, candidatesQueue }>
    this.peers = new Map();
    this.localUserId = null;
  }

  setLocalUserId(userId) {
    this.localUserId = userId;
  }

  getPeerCount() {
    return this.peers.size;
  }

  hasPeer(peerId) {
    return this.peers.has(peerId);
  }

  /**
   * Initializes or gets an RTCPeerConnection for a proximate peer.
   *
   * @param {string} peerId
   * @param {boolean} isPolite
   * @returns {RTCPeerConnection}
   */
  createPeerConnection(peerId, isPolite = false) {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId).pc;
    }

    console.log(`[WebRTC] Creating RTCPeerConnection with peer: ${peerId} (isPolite: ${isPolite})`);

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS
    });

    const peerEntry = {
      pc,
      isPolite,
      makingOffer: false,
      ignoreOffer: false,
      candidatesQueue: []
    };

    this.peers.set(peerId, peerEntry);

    // 1. Add local microphone audio track if available
    const localStream = audioContextService.localStream;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // 2. Handle remote audio track arrival
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote audio track from peer: ${peerId}`);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      spatialAudioEngine.attachRemoteAudio(peerId, remoteStream);
    };

    // 3. ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socketClient) {
        this.socketClient.sendIceCandidate(peerId, event.candidate);
      }
    };

    // 4. Perfect negotiation onnegotiationneeded handler
    pc.onnegotiationneeded = async () => {
      try {
        peerEntry.makingOffer = true;
        await pc.setLocalDescription();
        this.socketClient.sendOffer(peerId, pc.localDescription);
      } catch (err) {
        console.error(`[WebRTC] Negotiation error with ${peerId}:`, err);
      } finally {
        peerEntry.makingOffer = false;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${peerId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        // Attempt ICE restart if needed
        pc.restartIce?.();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        this.closePeer(peerId);
      }
    };

    return pc;
  }

  async handleOffer(senderUserId, sdp, isPolite = false) {
    let peerEntry = this.peers.get(senderUserId);
    if (!peerEntry) {
      this.createPeerConnection(senderUserId, isPolite);
      peerEntry = this.peers.get(senderUserId);
    }

    const { pc } = peerEntry;
    const offerCollision =
      peerEntry.makingOffer || pc.signalingState !== 'stable';

    peerEntry.ignoreOffer = !peerEntry.isPolite && offerCollision;
    if (peerEntry.ignoreOffer) {
      console.warn(`[WebRTC] Collision detected: Impolite peer ignoring offer from ${senderUserId}`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      // Process any queued ICE candidates
      while (peerEntry.candidatesQueue.length > 0) {
        const cand = peerEntry.candidatesQueue.shift();
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      }

      await pc.setLocalDescription();
      this.socketClient.sendAnswer(senderUserId, pc.localDescription);
    } catch (err) {
      console.error(`[WebRTC] Error handling offer from ${senderUserId}:`, err);
    }
  }

  async handleAnswer(senderUserId, sdp) {
    const peerEntry = this.peers.get(senderUserId);
    if (!peerEntry) return;

    try {
      await peerEntry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      // Flush queued candidates
      while (peerEntry.candidatesQueue.length > 0) {
        const cand = peerEntry.candidatesQueue.shift();
        await peerEntry.pc.addIceCandidate(new RTCIceCandidate(cand));
      }
    } catch (err) {
      console.error(`[WebRTC] Error handling answer from ${senderUserId}:`, err);
    }
  }

  async handleIceCandidate(senderUserId, candidate) {
    const peerEntry = this.peers.get(senderUserId);
    if (!peerEntry) return;

    const { pc } = peerEntry;
    try {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        peerEntry.candidatesQueue.push(candidate);
      }
    } catch (err) {
      if (!peerEntry.ignoreOffer) {
        console.error(`[WebRTC] Error adding ICE candidate from ${senderUserId}:`, err);
      }
    }
  }

  closePeer(peerId) {
    const peerEntry = this.peers.get(peerId);
    if (!peerEntry) return;

    try {
      peerEntry.pc.close();
    } catch (e) {
      // Ignore close errors
    }

    this.peers.delete(peerId);
    spatialAudioEngine.detachRemoteAudio(peerId);
    console.log(`[WebRTC] Closed and cleaned up peer: ${peerId}`);
  }

  closeAll() {
    for (const peerId of this.peers.keys()) {
      this.closePeer(peerId);
    }
    this.peers.clear();
  }
}

