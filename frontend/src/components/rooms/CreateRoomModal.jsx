/**
 * Final Proxispeak - Create Room Modal
 */

import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { createRoom } from '../../services/api/roomApi.js';

export function CreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [layoutId, setLayoutId] = useState('default-office-layout');
  const [capacity, setCapacity] = useState(50);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanRoomId = roomId.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanRoomId || !name.trim()) {
      setError('Please provide both Room ID and Room Name.');
      return;
    }

    try {
      setLoading(true);
      const newRoom = await createRoom({
        roomId: cleanRoomId,
        name: name.trim(),
        layoutId: layoutId,
        maxCapacity: Number(capacity) || 50
      });
      onRoomCreated(newRoom);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Virtual Office Room</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="roomIdInput">Room Identifier (slug)</label>
            <input
              id="roomIdInput"
              type="text"
              placeholder="e.g. design-studio"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomNameInput">Room Display Name</label>
            <input
              id="roomNameInput"
              type="text"
              placeholder="e.g. Design Studio & Lounge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="layoutSelectInput">Environment Layout</label>
            <select
              id="layoutSelectInput"
              value={layoutId}
              onChange={(e) => setLayoutId(e.target.value)}
            >
              <option value="default-office-layout">Global Innovation Hub (3D Tech Office & Boardroom)</option>
              <option value="modern-house-layout">Luxury Smart House (Alternative Residence)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="capacityInput">Capacity (2 - 200)</label>
            <input
              id="capacityInput"
              type="number"
              min={2}
              max={200}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Plus size={16} />
              <span>{loading ? 'Creating...' : 'Create Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

