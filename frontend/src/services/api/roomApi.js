/**
 * Final Proxispeak - REST API Client Service
 */

import { API_BASE } from '../../constants/config.js';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchRooms() {
  const res = await fetch(`${API_BASE}/rooms`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchRoomDetails(roomId) {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}`);
  const json = await res.json();
  return json.data;
}

export async function fetchLayouts() {
  const res = await fetch(`${API_BASE}/layouts`);
  const json = await res.json();
  return json.data || [];
}

export async function createRoom(roomData) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roomData)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to create room');
  }
  return json.data;
}

