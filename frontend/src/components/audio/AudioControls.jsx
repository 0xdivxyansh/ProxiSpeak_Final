/**
 * Final Proxispeak - Audio Controls & Voice Activity Bar
 */

import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, ShieldAlert } from 'lucide-react';
import { audioContextService } from '../../services/audio/audioContextService.js';

export function AudioControls({
  isMuted,
  proximityCount = 0,
  onToggleMute = () => {},
  onRequestMic = () => {}
}) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasMicAccess, setHasMicAccess] = useState(false);

  useEffect(() => {
    let animId;
    const updateLevel = () => {
      setHasMicAccess(Boolean(audioContextService.localTrack));
      setAudioLevel(audioContextService.getAudioLevel());
      animId = requestAnimationFrame(updateLevel);
    };
    animId = requestAnimationFrame(updateLevel);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="audio-dock">
      {hasMicAccess ? (
        <button
          className={`mic-toggle-btn ${isMuted ? 'muted' : 'active'}`}
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          <span>{isMuted ? 'Muted' : 'Speaking'}</span>
        </button>
      ) : (
        <button className="mic-request-btn" onClick={onRequestMic} title="Enable Microphone">
          <MicOff size={18} />
          <span>Enable Mic</span>
        </button>
      )}

      {/* Voice level meter */}
      <div className="audio-meter-container" title="Microphone Level">
        <div
          className="audio-meter-fill"
          style={{
            width: isMuted ? '0%' : `${Math.min(100, Math.round(audioLevel * 300))}%`
          }}
        />
      </div>

      {/* Peer Audio Range Badge */}
      <div
        className={`proximity-badge ${proximityCount > 0 ? 'in-range' : 'idle'}`}
        title="WebRTC Proximity Audio Connections"
      >
        <Volume2 size={16} />
        <span>
          {proximityCount > 0
            ? `${proximityCount} Peer${proximityCount > 1 ? 's' : ''} in Audio Range`
            : 'No peers nearby (< 100px)'}
        </span>
      </div>
    </div>
  );
}

