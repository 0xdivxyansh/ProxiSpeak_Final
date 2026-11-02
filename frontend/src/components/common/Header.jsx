/**
 * Final Proxispeak - Workspace Header Component
 */

import React from 'react';
import { LogOut, Users, Radio, Compass, Box } from 'lucide-react';

export function Header({
  roomName = 'Global Innovation Hub',
  userCount = 1,
  localUser,
  fps = 60,
  viewMode = '2d',
  onToggleViewMode = () => {},
  onLeave = () => {},
  onToggleSidebar = () => {},
  isSidebarOpen = false
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-container">
          <Radio className="logo-icon" size={20} />
          <span className="logo-text">ProxiSpeak</span>
        </div>
        <div className="divider"></div>
        <div className="room-info">
          <Compass size={16} className="text-muted" />
          <span className="room-title">{roomName}</span>
        </div>
      </div>

      <div className="header-right">
        {/* 2D / 3D Mode Toggle Switch */}
        <button
          className={`view-mode-toggle-btn ${viewMode === '3d' ? 'active-3d' : ''}`}
          onClick={onToggleViewMode}
          title={viewMode === '3d' ? 'Switch to 2D Planar Map' : 'Switch to 3D Spatial Office'}
        >
          <Box size={16} />
          <span>{viewMode === '3d' ? '3D Mode' : '2D Mode'}</span>
        </button>

        <div className="fps-indicator" title="Current Canvas Render Rate">
          {fps} FPS
        </div>

        <button
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title="Toggle Room Members"
        >
          <Users size={16} />
          <span>{userCount}</span>
        </button>

        {localUser && (
          <div className="user-badge" title="Your Identity">
            <span
              className="user-color-dot"
              style={{ backgroundColor: localUser.color || '#38bdf8' }}
            />
            <span className="user-name">{localUser.displayName}</span>
          </div>
        )}

        <button className="leave-btn" onClick={onLeave} title="Leave Virtual Office">
          <LogOut size={16} />
          <span>Leave</span>
        </button>
      </div>
    </header>
  );
}

