/**
 * Final Proxispeak - Landing & Room Selection Screen
 */

import React, { useState, useEffect } from 'react';
import { Radio, Users, Plus, Mic, ArrowRight, Sparkles } from 'lucide-react';
import { fetchRooms } from '../../services/api/roomApi.js';
import { CreateRoomModal } from './CreateRoomModal.jsx';
import { AVATAR_DEFAULTS } from '@proxispeak/shared';

export function JoinScreen({ onJoin }) {
  const [displayName, setDisplayName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('main-hall');
  const [selectedColor, setSelectedColor] = useState(AVATAR_DEFAULTS.COLORS[0]);
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await fetchRooms();
      setRooms(data);
      if (data.length > 0 && !data.some((r) => r.roomId === selectedRoomId)) {
        setSelectedRoomId(data[0].roomId);
      }
    } catch (err) {
      console.warn('[JoinScreen] Could not load rooms, using default:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    onJoin({
      displayName: displayName.trim(),
      roomId: selectedRoomId,
      color: selectedColor
    });
  };

  return (
    <div className="join-container">
      <div className="join-card">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="logo-badge">
            <Radio size={28} />
          </div>
          <h1>ProxiSpeak</h1>
          <p className="subtitle">
            Geospatial Proximity Audio Virtual Office
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="join-form">
          {/* Display Name Input */}
          <div className="form-group">
            <label htmlFor="displayName">Your Display Name</label>
            <input
              id="displayName"
              type="text"
              placeholder="e.g. Alex Rivera"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={25}
              required
              autoFocus
            />
          </div>

          {/* Room Selector */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="roomSelect">Select Virtual Room</label>
              <button
                type="button"
                className="text-btn"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={14} /> New Room
              </button>
            </div>

            <select
              id="roomSelect"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              {rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.name} ({r.userCount || 0} active)
                </option>
              ))}
              {rooms.length === 0 && (
                <option value="main-hall">Global Innovation Hub (3D Tech Office)</option>
              )}
            </select>
          </div>

          {/* Avatar Color Picker */}
          <div className="form-group">
            <label>Avatar Color</label>
            <div className="color-palette">
              {AVATAR_DEFAULTS.COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${selectedColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedColor(c)}
                  title={`Color: ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Features Reminder */}
          <div className="feature-callout">
            <div className="feature-item">
              <Sparkles size={16} className="text-accent" />
              <span>Spatial WebRTC Audio activates within 100px</span>
            </div>
            <div className="feature-item">
              <Mic size={16} className="text-accent" />
              <span>Distance attenuation, stereo panning & obstacle muffling</span>
            </div>
          </div>

          <button type="submit" className="join-submit-btn">
            <span>Enter Virtual Office</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRoomCreated={(newRoom) => {
          setRooms((prev) => [...prev, newRoom]);
          setSelectedRoomId(newRoom.roomId);
        }}
      />
    </div>
  );
}

