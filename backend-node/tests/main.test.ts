import request from 'supertest';
import { app } from '../src/main';

describe('Base API Endpoints', () => {
  it('GET / should return basic info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      name: 'solar-erp-backend',
      version: '1.0.0',
      status: 'running',
      docs: '/docs',
    });
  });

  it('GET /health should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'healthy',
    });
  });
});
