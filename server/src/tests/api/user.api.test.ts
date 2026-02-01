import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Database } from 'sqlite';
import { createTestDb, seedDatabase, getUserByEmail } from './helpers/testDb';
import { generateAdminToken, generateUserToken, createAuthHeader } from './helpers/authHelpers';
import { Application } from 'express';
import { createApp } from '../../createApp';
import { UserRoleEnum } from '../../Utils/UserRole';

describe('User Management API', () => {
  let db: Database;
  let app: Application;

  beforeEach(async () => {
    db = await createTestDb();
    app = createApp(db);
  });

  describe('GET /getUsers', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should return all users', async () => {
      const response = await request(app)
        .get('/getUsers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return users with correct structure', async () => {
      const response = await request(app)
        .get('/getUsers')
        .expect(200);

      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('userRole');
    });

    it('should return all 5 seeded users', async () => {
      const response = await request(app)
        .get('/getUsers')
        .expect(200);

      expect(response.body.length).toBe(5);
    });

    it('should return empty array for empty database', async () => {
      const emptyDb = await createTestDb();
      const emptyApp = createApp(emptyDb);

      const response = await request(emptyApp)
        .get('/getUsers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /user/status', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should return users with confirmed status', async () => {
      const response = await request(app)
        .get('/user/status')
        .query({ status: 'confirmed' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((user: { status: string }) => {
        expect(user.status).toBe('confirmed');
      });
    });

    it('should return users with unconfirmed status', async () => {
      const response = await request(app)
        .get('/user/status')
        .query({ status: 'unconfirmed' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((user: { status: string }) => {
        expect(user.status).toBe('unconfirmed');
      });
    });

    it('should return users with suspended status', async () => {
      const response = await request(app)
        .get('/user/status')
        .query({ status: 'suspended' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((user: { status: string }) => {
        expect(user.status).toBe('suspended');
      });
    });

    it('should return users with removed status', async () => {
      const response = await request(app)
        .get('/user/status')
        .query({ status: 'removed' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((user: { status: string }) => {
        expect(user.status).toBe('removed');
      });
    });

    it('should return empty array for status with no users', async () => {
      const response = await request(app)
        .get('/user/status')
        .query({ status: 'nonexistent' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /user/status (with authentication)', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should update user status with valid admin token', async () => {
      const adminToken = generateAdminToken();

      const response = await request(app)
        .post('/user/status')
        .set('Authorization', createAuthHeader(adminToken))
        .send({ userEmail: 'test@test.com', status: 'suspended' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');

      const user = await getUserByEmail(db, 'test@test.com');
      expect(user.status).toBe('suspended');
    });

    it('should allow user to update own status', async () => {
      const userToken = generateUserToken();

      const response = await request(app)
        .post('/user/status')
        .set('Authorization', createAuthHeader(userToken))
        .send({ userEmail: 'test@test.com', status: 'suspended' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');
    });

    it('should reject missing Authorization header', async () => {
      const response = await request(app)
        .post('/user/status')
        .send({ email: 'test@test.com', status: 'suspended' })
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/user/status')
        .set('Authorization', 'Bearer invalid-token')
        .send({ email: 'test@test.com', status: 'suspended' })
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });

    it('should reject non-admin editing other user', async () => {
      const userToken = generateUserToken();

      const response = await request(app)
        .post('/user/status')
        .set('Authorization', createAuthHeader(userToken))
        .send({ userEmail: 'admin@test.com', status: 'suspended' })
        .expect(403);

      expect(response.body.message).toBe('Forbidden: You can only edit your own data');
    });

    it('should allow admin to edit any user', async () => {
      const adminToken = generateAdminToken();

      const response = await request(app)
        .post('/user/status')
        .set('Authorization', createAuthHeader(adminToken))
        .send({ userEmail: 'unconfirmed@test.com', status: 'confirmed' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');
    });

    it('should reject missing userEmail', async () => {
      const adminToken = generateAdminToken();

      const response = await request(app)
        .post('/user/status')
        .set('Authorization', createAuthHeader(adminToken))
        .send({ status: 'suspended' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should reject missing status', async () => {
      const adminToken = generateAdminToken();

      const response = await request(app)
        .post('/user/status')
        .set('Authorization', createAuthHeader(adminToken))
        .send({ userEmail: 'test@test.com' })
        .expect(400);

      expect(response.body.message).toBe('Please provide email and status');
    });
  });

  describe('POST /user/status/all', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should update all confirmed users', async () => {
      const response = await request(app)
        .post('/user/status/all')
        .send({ status: 'suspended' })
        .expect(200);

      expect(response.body.message).toContain('All confirmed users have been updated');

      const users = await db.all('SELECT * FROM users WHERE status = ?', ['suspended']);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should reject missing status', async () => {
      const response = await request(app)
        .post('/user/status/all')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Status is required');
    });

    it('should return 404 when no confirmed users exist', async () => {
      // Update all confirmed users first
      await db.run('UPDATE users SET status = ? WHERE status = ?', ['suspended', 'confirmed']);

      const response = await request(app)
        .post('/user/status/all')
        .send({ status: 'removed' })
        .expect(404);

      expect(response.body.message).toBe('No confirmed users found to update');
    });

    it('should only affect confirmed users', async () => {
      const beforeUnconfirmed = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE status = ?',
        ['unconfirmed']
      );

      await request(app)
        .post('/user/status/all')
        .send({ status: 'suspended' })
        .expect(200);

      const afterUnconfirmed = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE status = ?',
        ['unconfirmed']
      );

      expect(afterUnconfirmed.count).toBe(beforeUnconfirmed.count);
    });
  });

  describe('GET /user/role', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should return user role for valid email', async () => {
      const response = await request(app)
        .get('/user/role')
        .query({ userEmail: 'admin@test.com' })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.userRole).toBe(UserRoleEnum.admin);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/user/role')
        .query({ userEmail: 'nonexistent@test.com' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should return USER role for regular user', async () => {
      const response = await request(app)
        .get('/user/role')
        .query({ userEmail: 'test@test.com' })
        .expect(200);

      expect(response.body.userRole).toBe(UserRoleEnum.user);
    });
  });

  describe('POST /user/role', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should update user role with valid data', async () => {
      const response = await request(app)
        .post('/user/role')
        .send({ email: 'test@test.com', role: UserRoleEnum.admin })
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');

      const user = await getUserByEmail(db, 'test@test.com');
      expect(user.userRole).toBe(UserRoleEnum.admin);
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/user/role')
        .send({ role: UserRoleEnum.admin })
        .expect(400);

      expect(response.body.message).toBe('Please provide email and role');
    });

    it('should reject missing role', async () => {
      const response = await request(app)
        .post('/user/role')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.message).toBe('Please provide email and role');
    });

    it('should update role to USER', async () => {
      const response = await request(app)
        .post('/user/role')
        .send({ email: 'admin@test.com', role: UserRoleEnum.user })
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');

      const user = await getUserByEmail(db, 'admin@test.com');
      expect(user.userRole).toBe(UserRoleEnum.user);
    });
  });
});
