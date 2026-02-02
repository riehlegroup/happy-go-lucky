import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Database } from 'sqlite';
import { createTestDb, seedDatabase, getUserByEmail } from './helpers/testDb';
import { Application } from 'express';
import { createApp } from '../../createApp';

describe('User Configuration API', () => {
  let db: Database;
  let app: Application;

  beforeEach(async () => {
    db = await createTestDb();
    app = createApp(db);
  });

  describe('POST /user/mail (change email)', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should change email with valid data', async () => {
      const response = await request(app)
        .post('/user/mail')
        .send({ oldEmail: 'test@test.com', newEmail: 'newemail@test.com' })
        .expect(200);

      expect(response.body.message).toBe('Email updated successfully');

      const user = await db.get('SELECT * FROM users WHERE id = ?', [2]);
      expect(user.email).toBe('newemail@test.com');
    });

    it('should reject missing newEmail', async () => {
      const response = await request(app)
        .post('/user/mail')
        .send({ oldEmail: 'test@test.com' })
        .expect(400);

      expect(response.body.message).toBe('Please fill in new email!');
    });

    it('should reject invalid email format (no @)', async () => {
      const response = await request(app)
        .post('/user/mail')
        .send({ oldEmail: 'test@test.com', newEmail: 'notanemail' })
        .expect(400);

      expect(response.body.message).toBe('Invalid email address');
    });

    it('should update email in database', async () => {
      await request(app)
        .post('/user/mail')
        .send({ oldEmail: 'test@test.com', newEmail: 'updated@test.com' })
        .expect(200);

      const oldUser = await getUserByEmail(db, 'test@test.com');
      expect(oldUser).toBeUndefined();

      const newUser = await getUserByEmail(db, 'updated@test.com');
      expect(newUser).toBeDefined();
    });
  });

  describe('POST /user/password/change', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should change password with valid data', async () => {
      const response = await request(app)
        .post('/user/password/change')
        .send({ userEmail: 'test@test.com', password: 'NewPassword123!' })
        .expect(200);

      expect(response.body.message).toBe('Password updated successfully');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/user/password/change')
        .send({ userEmail: 'test@test.com' })
        .expect(400);

      expect(response.body.message).toBe('Please fill in new password!');
    });

    it('should reject password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/user/password/change')
        .send({ userEmail: 'test@test.com', password: 'short' })
        .expect(400);

      expect(response.body.message).toBe('Password must be at least 8 characters long');
    });

    it('should hash the password', async () => {
      const newPassword = 'NewPassword123!';

      await request(app)
        .post('/user/password/change')
        .send({ userEmail: 'test@test.com', password: newPassword })
        .expect(200);

      const user = await getUserByEmail(db, 'test@test.com');
      expect(user.password).not.toBe(newPassword);
      expect(user.password).toBeTruthy();
    });
  });

  describe('POST /user/project/url', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should set project URL with valid data', async () => {
      const response = await request(app)
        .post('/user/project/url')
        .send({
          userEmail: 'test@test.com',
          projectName: 'Test Project',
          URL: 'https://github.com/user/repo.git'
        })
        .expect(200);

      expect(response.body.message).toBe('URL added successfully');

      const membership = await db.get(
        'SELECT url FROM user_projects WHERE userId = 2 AND projectId = 1'
      );
      expect(membership.url).toBe('https://github.com/user/repo.git');
    });

    it('should reject missing URL', async () => {
      const response = await request(app)
        .post('/user/project/url')
        .send({ userEmail: 'test@test.com', projectName: 'Test Project' })
        .expect(400);

      expect(response.body.message).toBe('Please fill in URL!');
    });

    it('should reject URL without git', async () => {
      const response = await request(app)
        .post('/user/project/url')
        .send({
          userEmail: 'test@test.com',
          projectName: 'Test Project',
          URL: 'https://example.com'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid URL');
    });

    it('should accept various git URLs', async () => {
      const validUrls = [
        'https://github.com/user/repo.git',
        'git@github.com:user/repo.git',
        'https://gitlab.com/user/project.git'
      ];

      for (const url of validUrls) {
        const response = await request(app)
          .post('/user/project/url')
          .send({
            userEmail: 'test@test.com',
            projectName: 'Test Project',
            URL: url
          })
          .expect(200);

        expect(response.body.message).toBe('URL added successfully');
      }
    });
  });

  describe('POST /projConfig/changeURL (legacy)', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should set project URL with valid data', async () => {
      const response = await request(app)
        .post('/projConfig/changeURL')
        .send({
          userEmail: 'test@test.com',
          projectName: 'Test Project',
          URL: 'https://github.com/user/repo.git'
        })
        .expect(200);

      expect(response.body.message).toBe('URL added successfully');
    });
  });

  describe('GET /user/project/url', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should return URL for valid user and project', async () => {
      // First set a URL
      await request(app)
        .post('/user/project/url')
        .send({
          userEmail: 'test@test.com',
          projectName: 'Test Project',
          URL: 'https://github.com/user/repo.git'
        })
        .expect(200);

      const response = await request(app)
        .get('/user/project/url')
        .query({ userEmail: 'test@test.com', projectName: 'Test Project' })
        .expect(200);

      expect(response.body.url).toBe('https://github.com/user/repo.git');
    });

    it('should reject missing userEmail', async () => {
      const response = await request(app)
        .get('/user/project/url')
        .query({ projectName: 'Test Project' })
        .expect(400);

      expect(response.body.message).toBe('User email and project name are mandatory!');
    });

    it('should reject missing projectName', async () => {
      const response = await request(app)
        .get('/user/project/url')
        .query({ userEmail: 'test@test.com' })
        .expect(400);

      expect(response.body.message).toBe('User email and project name are mandatory!');
    });

    it('should return null for user with no URL set', async () => {
      const response = await request(app)
        .get('/user/project/url')
        .query({ userEmail: 'test@test.com', projectName: 'Test Project' })
        .expect(200);

      expect(response.body.url).toBeNull();
    });
  });

  describe('POST /user/githubUsername', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should set GitHub username with valid data', async () => {
      const response = await request(app)
        .post('/user/githubUsername')
        .send({ userEmail: 'test@test.com', newGithubUsername: 'testgithubuser' })
        .expect(200);

      expect(response.body.message).toBe('GitHub username added successfully');

      const user = await getUserByEmail(db, 'test@test.com');
      expect(user.githubUsername).toBe('testgithubuser');
    });

    it('should reject missing userEmail', async () => {
      const response = await request(app)
        .post('/user/githubUsername')
        .send({ newGithubUsername: 'testgithubuser' })
        .expect(400);

      expect(response.body.message).toBe('User email is required!');
    });

    it('should reject missing newGithubUsername', async () => {
      const response = await request(app)
        .post('/user/githubUsername')
        .send({ userEmail: 'test@test.com' })
        .expect(400);

      expect(response.body.message).toBe('Please fill in GitHub username!');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/user/githubUsername')
        .send({ userEmail: 'nonexistent@test.com', newGithubUsername: 'testuser' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should update existing GitHub username', async () => {
      await request(app)
        .post('/user/githubUsername')
        .send({ userEmail: 'test@test.com', newGithubUsername: 'firstusername' })
        .expect(200);

      await request(app)
        .post('/user/githubUsername')
        .send({ userEmail: 'test@test.com', newGithubUsername: 'updatedusername' })
        .expect(200);

      const user = await getUserByEmail(db, 'test@test.com');
      expect(user.githubUsername).toBe('updatedusername');
    });
  });

  describe('GET /user/githubUsername', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should return GitHub username for valid user', async () => {
      // First set a username
      await request(app)
        .post('/user/githubUsername')
        .send({ userEmail: 'test@test.com', newGithubUsername: 'testgithubuser' })
        .expect(200);

      const response = await request(app)
        .get('/user/githubUsername')
        .query({ userEmail: 'test@test.com' })
        .expect(200);

      expect(response.body.githubUsername).toBe('testgithubuser');
    });

    it('should reject missing userEmail', async () => {
      const response = await request(app)
        .get('/user/githubUsername')
        .expect(400);

      expect(response.body.message).toBe('User email is mandatory!');
    });

    it('should return empty string for user with no username', async () => {
      const response = await request(app)
        .get('/user/githubUsername')
        .query({ userEmail: 'test@test.com' })
        .expect(200);

      expect(response.body.githubUsername).toBe('');
    });

    it('should return empty string instead of null', async () => {
      const response = await request(app)
        .get('/user/githubUsername')
        .query({ userEmail: 'admin@test.com' })
        .expect(200);

      expect(response.body.githubUsername).toBe('');
      expect(response.body.githubUsername).not.toBeNull();
    });
  });
});
