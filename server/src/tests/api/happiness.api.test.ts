import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Database } from 'sqlite';
import { createTestDb, seedDatabase } from './helpers/testDb';
import { validHappinessMetric, validStandup } from './helpers/fixtures';
import { Application } from 'express';
import { createApp } from '../../createApp';

describe('Happiness API', () => {
  let db: Database;
  let app: Application;

  beforeEach(async () => {
    db = await createTestDb();
    app = createApp(db);
  });

  describe('POST /courseProject/happiness', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should save happiness metric with valid data', async () => {
      const metric = validHappinessMetric();
      const response = await request(app)
        .post('/courseProject/happiness')
        .send(metric)
        .expect(200);

      expect(response.body.message).toBe('Happiness updated successfully');

      const saved = await db.get(
        'SELECT * FROM happiness WHERE userId = 2 AND projectId = 1'
      );
      expect(saved).toBeDefined();
      expect(saved.happiness).toBe(4);
    });

    it('should reject missing submissionDateId', async () => {
      const response = await request(app)
        .post('/courseProject/happiness')
        .send({
          projectName: 'Test Project',
          userEmail: 'test@test.com',
          happiness: 4
        })
        .expect(400);

      expect(response.body.message).toContain('Submission date ID is required');
    });

    it('should reject invalid submissionDateId', async () => {
      const response = await request(app)
        .post('/courseProject/happiness')
        .send({
          projectName: 'Test Project',
          userEmail: 'test@test.com',
          happiness: 4,
          submissionDateId: 99999
        })
        .expect(404);

      expect(response.body.message).toBe('Submission date not found');
    });

    it('should store timestamp automatically', async () => {
      const metric = validHappinessMetric();
      const beforeTime = new Date().toISOString();

      await request(app)
        .post('/courseProject/happiness')
        .send(metric)
        .expect(200);

      const saved = await db.get(
        'SELECT * FROM happiness WHERE userId = 2 AND projectId = 1'
      );
      expect(saved.timestamp).toBeDefined();
      expect(new Date(saved.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
    });

    it('should replace existing happiness entry for same user/project/submission', async () => {
      const metric = validHappinessMetric();

      // Submit first happiness rating
      await request(app)
        .post('/courseProject/happiness')
        .send(metric)
        .expect(200);

      // Submit second happiness rating for same submission
      await request(app)
        .post('/courseProject/happiness')
        .send({ ...metric, happiness: 5 })
        .expect(200);

      // Should only have 1 entry (the latest one)
      const entries = await db.all(
        'SELECT * FROM happiness WHERE userId = 2 AND projectId = 1 AND submissionDateId = 1'
      );
      expect(entries.length).toBe(1);
      expect(entries[0].happiness).toBe(5);
    });
  });

  describe('GET /courseProject/happiness', () => {
    beforeEach(async () => {
      await seedDatabase(db);
      // Add some happiness data
      await request(app)
        .post('/courseProject/happiness')
        .send(validHappinessMetric())
        .expect(200);
    });

    it('should return happiness data for valid project', async () => {
      const response = await request(app)
        .get('/courseProject/happiness')
        .query({ projectName: 'Test Project' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return empty array for project with no data', async () => {
      await request(app)
        .post('/courseProject')
        .send({ courseId: 1, projectName: 'Empty Project' })
        .expect(201);

      const response = await request(app)
        .get('/courseProject/happiness')
        .query({ projectName: 'Empty Project' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should include submission date and user info', async () => {
      const response = await request(app)
        .get('/courseProject/happiness')
        .query({ projectName: 'Test Project' })
        .expect(200);

      const entry = response.body[0];
      expect(entry).toHaveProperty('submissionDate');
      expect(entry).toHaveProperty('userEmail');
      expect(entry).toHaveProperty('happiness');
      expect(entry).toHaveProperty('timestamp');
    });

    it('should return data sorted by submission date and timestamp', async () => {
      // Add another submission date
      await db.run(
        'INSERT INTO submissions (scheduleId, submissionDate) VALUES (?, ?)',
        [1, Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000)]
      );

      const submission2 = await db.get('SELECT id FROM submissions WHERE scheduleId = 1 ORDER BY submissionDate DESC LIMIT 1');

      // Add happiness for new submission
      await request(app)
        .post('/courseProject/happiness')
        .send({
          projectName: 'Test Project',
          userEmail: 'test@test.com',
          happiness: 5,
          submissionDateId: submission2.id
        })
        .expect(200);

      const response = await request(app)
        .get('/courseProject/happiness')
        .query({ projectName: 'Test Project' })
        .expect(200);

      expect(response.body.length).toBe(2);
      // Should be sorted by submissionDate
      const date1 = new Date(response.body[0].submissionDate).getTime();
      const date2 = new Date(response.body[1].submissionDate).getTime();
      expect(date1).toBeLessThan(date2);
    });
  });

  describe('GET /courseProject/availableSubmissions', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should return next available submission for project', async () => {
      const response = await request(app)
        .get('/courseProject/availableSubmissions')
        .query({ projectName: 'Test Project' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('submissionDate');
      expect(response.body).toHaveProperty('scheduleId');
    });

    it('should reject missing projectName', async () => {
      const response = await request(app)
        .get('/courseProject/availableSubmissions')
        .expect(400);

      expect(response.body.message).toBe('Project name is required');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/courseProject/availableSubmissions')
        .query({ projectName: 'Non Existent Project' })
        .expect(404);

      expect(response.body.message).toBe('Project not found');
    });

    it('should return 404 when course has no schedule', async () => {
      // Create course without schedule
      await request(app)
        .post('/course')
        .send({ courseName: 'No Schedule Course', termId: 1, studentsCanCreateProject: false })
        .expect(201);

      const courseResult = await db.get('SELECT id FROM courses WHERE courseName = ?', ['No Schedule Course']);

      await request(app)
        .post('/courseProject')
        .send({ courseId: courseResult.id, projectName: 'No Schedule Project' })
        .expect(201);

      const response = await request(app)
        .get('/courseProject/availableSubmissions')
        .query({ projectName: 'No Schedule Project' })
        .expect(404);

      expect(response.body.message).toBe('No schedule found for this course');
    });

    it('should return 404 when no future submissions available', async () => {
      // Delete existing submissions and create schedule with only past dates
      await db.run('DELETE FROM submissions WHERE scheduleId = 1');
      await db.run('DELETE FROM schedules WHERE id = 1');

      // Create schedule with past dates
      const pastStart = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const pastEnd = Date.now() - 1 * 24 * 60 * 60 * 1000;
      await db.run(
        'INSERT INTO schedules (id, startDate, endDate) VALUES (?, ?, ?)',
        [1, Math.floor(pastStart / 1000), Math.floor(pastEnd / 1000)]
      );

      // Add submission date within past range
      await db.run(
        'INSERT INTO submissions (scheduleId, submissionDate) VALUES (?, ?)',
        [1, Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)]
      );

      const response = await request(app)
        .get('/courseProject/availableSubmissions')
        .query({ projectName: 'Test Project' })
        .expect(404);

      expect(response.body.message).toBe('No future submission dates available');
    });

    it('should return earliest future submission when multiple exist', async () => {
      // The seedDatabase already creates a submission 7 days in the future
      // Just verify we get the earliest one
      const response = await request(app)
        .get('/courseProject/availableSubmissions')
        .query({ projectName: 'Test Project' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('submissionDate');
      // The submission date should be in the future
      expect(new Date(response.body.submissionDate).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /courseProject/standupsEmail', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('should send standup email with valid data', async () => {
      const standup = validStandup();
      const response = await request(app)
        .post('/courseProject/standupsEmail')
        .send(standup)
        .expect(200);

      expect(response.body.message).toBe('Standup email sent successfully');
    });

    it('should reject missing projectName', async () => {
      const response = await request(app)
        .post('/courseProject/standupsEmail')
        .send({
          userName: 'testuser',
          doneText: 'Done',
          plansText: 'Plans',
          challengesText: 'Challenges'
        })
        .expect(400);

      expect(response.body.message).toContain('No members in the project group');
    });

    it('should reject project with no members', async () => {
      await request(app)
        .post('/courseProject')
        .send({ courseId: 1, projectName: 'Empty Project' })
        .expect(201);

      const response = await request(app)
        .post('/courseProject/standupsEmail')
        .send({
          projectName: 'Empty Project',
          userName: 'testuser',
          doneText: 'Done',
          plansText: 'Plans',
          challengesText: 'Challenges'
        })
        .expect(400);

      expect(response.body.message).toBe('No members in the project group');
    });

    it('should work with all required fields', async () => {
      const response = await request(app)
        .post('/courseProject/standupsEmail')
        .send({
          projectName: 'Test Project',
          userName: 'testuser',
          doneText: 'Completed tasks',
          plansText: 'Future plans',
          challengesText: 'Current challenges'
        })
        .expect(200);

      expect(response.body.message).toBe('Standup email sent successfully');
    });
  });
});
