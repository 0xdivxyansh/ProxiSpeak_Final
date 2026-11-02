/**
 * Final Proxispeak - Active Room Users Sidebar
 */

import React from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { calculateDistance } from '@proxispeak/shared';

export function UserListSidebar({
  isOpen,
  onClose,
  localUser,
  remoteUsers = [],
  proximityPeerIds = new Set()
}) {
  if (!isOpen) return null;

  const allUsers = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map((u) => ({ ...u, isLocal: false }))
  ];

  return (
    <aside className="user-sidebar">
      <div className="sidebar-header">
        <h3>Room Participants ({allUsers.length})</h3>
        <button className="close-btn" onClick={onClose} title="Close Sidebar">
          <X size={18} />
        </button>
      </div>

      <div className="user-list">
        {allUsers.map((user) => {
          const isNearby = proximityPeerIds.has(user.userId);
          let distText = 'Local';
          if (!user.isLocal && localUser) {
            const dist = Math.round(calculateDistance(localUser.x, localUser.y, user.x, user.y));
            distText = `${dist}px`;
          }

          return (
            <div key={user.userId} className={`user-row ${isNearby ? 'nearby' : ''}`}>
              <span className="avatar-dot" style={{ backgroundColor: user.color || '#38bdf8' }} />
              <div className="user-info">
                <span className="name">{user.displayName} {user.isLocal && '(You)'}</span>
                <span className="distance-label">
                  {user.isLocal ? 'Self' : `Distance: ${distText}`}
                </span>
              </div>

              <div className="user-status-icons">
                {isNearby && (
                  <span className="in-range-icon" title="Connected via WebRTC Audio">
                    <Volume2 size={16} />
                  </span>
                )}
                {user.isMuted ? (
                  <MicOff size={16} className="text-danger" title="Muted" />
                ) : (
                  <Mic size={16} className="text-success" title="Active Microphone" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

