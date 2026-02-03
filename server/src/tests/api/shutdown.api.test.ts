import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Database } from 'sqlite';
import { Application } from 'express';
import { createApp } from '../../createApp';
import { createTestDb, seedDatabase } from './helpers/testDb';
import { createAuthHeader, generateAdminToken, generateUserToken } from './helpers/authHelpers';

describe('System shutdown API', () => {
  let db: Database;
  let app: Application;

  beforeEach(async () => {
    db = await createTestDb();
    await seedDatabase(db);
    app = createApp(db);
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .post('/admin/shutdown')
      .send({})
      .expect(401);

    expect(response.body.message).toBe('Authentication required');
  });

  it('should require admin role', async () => {
    const userToken = generateUserToken();
    const response = await request(app)
      .post('/admin/shutdown')
      .set('Authorization', createAuthHeader(userToken))
      .send({})
      .expect(403);

    expect(response.body.message).toBe('Forbidden: Admin access required');
  });

  it('should initiate shutdown and reject subsequent requests', async () => {
    const adminToken = generateAdminToken();

    const shutdownResponse = await request(app)
      .post('/admin/shutdown')
      .set('Authorization', createAuthHeader(adminToken))
      .send({})
      .expect(202);

    expect(shutdownResponse.body.success).toBe(true);

    const blocked = await request(app)
      .get('/term')
      .expect(503);

    expect(blocked.body.message).toBe('Server is shutting down');
  });

  it('should be idempotent when called multiple times', async () => {
    const adminToken = generateAdminToken();

    await request(app)
      .post('/admin/shutdown')
      .set('Authorization', createAuthHeader(adminToken))
      .send({})
      .expect(202);

    const second = await request(app)
      .post('/admin/shutdown')
      .set('Authorization', createAuthHeader(adminToken))
      .send({})
      .expect(200);

    expect(second.body.success).toBe(true);
    expect(second.body.message).toMatch(/already in progress/i);
  });
});
