import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';

describe('HTTP REST API Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /api/health returns health status object', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('services');
    expect(res.body).toHaveProperty('workspace');
    expect(res.body.workspace.proximityRadius).toBe(100);
  });

  it('GET /api/layouts returns layout definitions', async () => {
    const res = await request(app).get('/api/layouts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const layout = res.body.data[0];
      expect(layout).toHaveProperty('layoutId');
      expect(layout).toHaveProperty('dimensions');
      expect(layout).toHaveProperty('furniture');
    }
  });

  it('GET /api/layouts/default-office-layout returns default office layout', async () => {
    const res = await request(app).get('/api/layouts/default-office-layout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.layoutId).toBe('default-office-layout');
    expect(res.body.data.dimensions.width).toBe(1600);
    expect(res.body.data.dimensions.height).toBe(1000);
  });

  it('GET /api/layouts/non-existent returns 404', async () => {
    const res = await request(app).get('/api/layouts/non-existent-layout-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('LAYOUT_NOT_FOUND');
  });

  it('GET /api/rooms returns room list', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/rooms validates input schemas', async () => {
    const invalidRes = await request(app).post('/api/rooms').send({
      roomId: 'bad room name with spaces'
    });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.error.code).toBe('INVALID_INPUT');
  });

  it('Returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
