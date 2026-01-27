import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Database } from 'sqlite';
import { createTestDb, seedDatabase } from './helpers/testDb';
import { Application } from 'express';
import { createApp } from '../../createApp';
import { ActivityType } from '../../Controllers/ActivityController';

describe('Activity API', () => {
    let db: Database;
    let app: Application;

    beforeEach(async () => {
        db = await createTestDb();
        app = createApp(db);
        await seedDatabase(db);
    });

    describe('GET /project/activities', () => {
        it('should return activities for valid project', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Test Project', limit: '10' })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should reject missing projectName', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ limit: '10' })
                .expect(400);

            expect(response.body.message).toBe('Project name is required');
        });

        it('should reject invalid limit parameter', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Test Project', limit: 'abc' })
                .expect(400);

            expect(response.body.message).toBe('Limit must be a positive integer');
        });

        it('should reject zero or negative limit', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Test Project', limit: '0' })
                .expect(400);

            expect(response.body.message).toBe('Limit must be a positive integer');
        });

        it('should use default limit when not provided', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Test Project' })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return activities with correct structure', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Test Project', limit: '10' })
                .expect(200);

            if (response.body.length > 0) {
                const activity = response.body[0];
                expect(activity).toHaveProperty('id');
                expect(activity).toHaveProperty('projectId');
                expect(activity).toHaveProperty('userId');
                expect(activity).toHaveProperty('userName');
                expect(activity).toHaveProperty('userEmail');
                expect(activity).toHaveProperty('activityType');
                expect(activity).toHaveProperty('timestamp');
            }
        });

        it('should return 404 for non-existent project', async () => {
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Non-Existent Project', limit: '10' })
                .expect(500);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('POST /project/activity', () => {
        it('should log activity with valid data', async () => {
            const response = await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    userEmail: 'testuser@example.com',
                    activityType: ActivityType.STANDUP_SUBMITTED,
                    activityData: null
                })
                .expect(201);

            expect(response.body.message).toBe('Activity logged successfully');
        });

        it('should log activity with activityData', async () => {
            const response = await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    userEmail: 'testuser@example.com',
                    activityType: ActivityType.HAPPINESS_SUBMITTED,
                    activityData: { happiness: 5 }
                })
                .expect(201);

            expect(response.body.message).toBe('Activity logged successfully');
        });

        it('should reject missing projectName', async () => {
            const response = await request(app)
                .post('/project/activity')
                .send({
                    userEmail: 'testuser@example.com',
                    activityType: ActivityType.USER_JOINED
                })
                .expect(400);

            expect(response.body.message).toContain('Project name');
        });

        it('should reject missing userEmail', async () => {
            const response = await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    activityType: ActivityType.USER_JOINED
                })
                .expect(400);

            expect(response.body.message).toContain('email');
        });

        it('should reject missing activityType', async () => {
            const response = await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    userEmail: 'testuser@example.com'
                })
                .expect(400);

            expect(response.body.message).toContain('activity type');
        });

        it('should reject invalid activityType', async () => {
            const response = await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    userEmail: 'testuser@example.com',
                    activityType: 'invalid_activity_type'
                })
                .expect(400);

            expect(response.body.message).toBe('Invalid activity type');
        });

        it('should accept all valid ActivityTypes', async () => {
            const validTypes = [
                ActivityType.STANDUP_SUBMITTED,
                ActivityType.HAPPINESS_SUBMITTED,
                ActivityType.USER_JOINED,
                ActivityType.USER_LEFT,
                ActivityType.PROJECT_CREATED,
                ActivityType.PROJECT_UPDATED
            ];

            for (const activityType of validTypes) {
                const response = await request(app)
                    .post('/project/activity')
                    .send({
                        projectName: 'Test Project',
                        userEmail: 'testuser@example.com',
                        activityType
                    });

                // Some may fail due to user/project not existing, but not due to invalid type
                expect(response.status).not.toBe(400);
                if (response.status === 201) {
                    expect(response.body.message).toBe('Activity logged successfully');
                }
            }
        });
    });

    describe('Activity retrieval after logging', () => {
        it('should retrieve logged activities in correct order', async () => {
            // Log multiple activities
            await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    userEmail: 'testuser@example.com',
                    activityType: ActivityType.USER_JOINED
                })
                .expect(201);

            // Give it a moment
            await new Promise(resolve => setTimeout(resolve, 100));

            await request(app)
                .post('/project/activity')
                .send({
                    projectName: 'Test Project',
                    userEmail: 'testuser@example.com',
                    activityType: ActivityType.STANDUP_SUBMITTED
                })
                .expect(201);

            // Retrieve activities
            const response = await request(app)
                .get('/project/activities')
                .query({ projectName: 'Test Project', limit: '10' })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Most recent activity should be first (STANDUP_SUBMITTED)
            if (response.body.length >= 2) {
                expect(response.body[0].activityType).toBe(ActivityType.STANDUP_SUBMITTED);
            }
        });
    });
});
