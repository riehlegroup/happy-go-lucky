import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Application } from "express";
import request from "supertest";
import { Database } from "sqlite";
import {
	createEvaluationEntryForLeaderboard,
	createTestDatabase,
	createTestSubmissionForUser,
	resetTestDatabase,
	TEST_COMPETITIONS,
	TEST_USERS,
} from "./helpers/testDb.helper";
import { generateTestToken } from "./helpers/auth.helper";
import { createApp } from "../../src/createApp";

describe("Leaderboard API integration test", () => {
	let db: Database;
	let app: Application;

	beforeAll(async () => {
		db = await createTestDatabase();
		app = createApp(db);
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await resetTestDatabase(db);
	});

	it("should return 401 if wrong token is provided", async () => {
		const token = "invalid_token";
		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/leaderboard`)
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(401);
	});

	it("should return 401 if no token is provided", async () => {
		const response = await request(app).get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/leaderboard`);
		expect(response.status).toBe(401);
	});

	it("should return 404 for non existent competition ID", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
		const response = await request(app)
			.get("/competitions/9999/leaderboard")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(404);
		expect(response.body.message).toBe("Competition not found");
	});

	it("should return 403 if user is not a member of the course", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_2.id); // Member of course 2, not course 1
		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/leaderboard`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(403);
	});

	it("should return 200 and ranked leaderboard data for a specific round", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);

		const submissionId1 = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_1.id,
			"http://example.com/api1",
			"alpha_team",
		);
		await createEvaluationEntryForLeaderboard(
			db,
			submissionId1,
			1,
			7.5,
			"EVALUATED",
			new Date().toISOString(),
			new Date().toISOString(),
			20,
		);

		const submissionId2 = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_2.id,
			"http://example.com/api2",
			"beta_team",
		);
		await createEvaluationEntryForLeaderboard(
			db,
			submissionId2,
			1,
			5.0,
			"EVALUATED",
			new Date().toISOString(),
			new Date().toISOString(),
			10,
		);

		// Also insert a FAILED evaluation for admin user to verify it is excluded from round leaderboard
		const submissionId3 = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.ADMIN.id,
			"http://example.com/api3",
			"failed_team",
		);
		await createEvaluationEntryForLeaderboard(
			db,
			submissionId3,
			1,
			2.0,
			"FAILED",
			new Date().toISOString(),
			new Date().toISOString(),
			15,
		);

		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/leaderboard/rounds/1?page=1&limit=10`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data).toHaveLength(2);
		expect(response.body.pagination).toEqual({
			page: 1,
			limit: 10,
			totalItems: 2,
			totalPages: 1,
			hasNextPage: false,
			hasPrevPage: false,
		});

		// Lower RMSE score ranks first
		expect(response.body.data[0]).toEqual(
			expect.objectContaining({
				rank: 1,
				pseudonym: "beta_team",
				score: 5.0,
				inference_time_ms: 10,
			}),
		);
		expect(response.body.data[1]).toEqual(
			expect.objectContaining({
				rank: 2,
				pseudonym: "alpha_team",
				score: 7.5,
				inference_time_ms: 20,
			}),
		);
	});

	it("should return 200 and overall leaderboard across finished rounds with round weights and penalties", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);

		const submissionId1 = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_1.id,
			"http://example.com/api1",
			"consistent",
		);
		const submissionId2 = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_2.id,
			"http://example.com/api2",
			"delayed_round2",
		);

		// Round 1 (weight 1): consistent_team = 4.0, delayed_round2_team = 3.0
		await createEvaluationEntryForLeaderboard(db, submissionId1, 1, 4.0, "EVALUATED", new Date().toISOString(), new Date().toISOString(), 100);
		await createEvaluationEntryForLeaderboard(db, submissionId2, 1, 3.0, "EVALUATED", new Date().toISOString(), new Date().toISOString(), 150);

		// Round 2 (weight 2): consistent_team = 5.0 (EVALUATED -> 5.0 * 2 = 10.0)
		// delayed_round2_team = 2.0 (DELAYED -> penalized with MAX(evaluated score in round 2) * 1.1 * 2 = 5.0 * 1.1 * 2 = 11.0, inference time capped at 900000)
		await createEvaluationEntryForLeaderboard(db, submissionId1, 2, 5.0, "EVALUATED", new Date().toISOString(), new Date().toISOString(), 200);
		await createEvaluationEntryForLeaderboard(db, submissionId2, 2, 2.0, "DELAYED", new Date().toISOString(), new Date().toISOString(), 950000);

		// Round 3 (PENDING): should be ignored on the finished rounds leaderboard
		await createEvaluationEntryForLeaderboard(db, submissionId1, 3, 0, "PENDING", new Date().toISOString(), new Date().toISOString(), 0);
		await createEvaluationEntryForLeaderboard(db, submissionId2, 3, 0, "PENDING", new Date().toISOString(), new Date().toISOString(), 0);

		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/leaderboard?page=1&limit=10`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveLength(2);

		// consistent total score: 4.0 * 1 + 5.0 * 2 = 14.0, total inference_time_ms: 100 + 200 = 300
		expect(response.body.data[0].rank).toBe(1);
		expect(response.body.data[0].pseudonym).toBe("consistent");
		expect(response.body.data[0].score).toBeCloseTo(14.0, 4);
		expect(response.body.data[0].inference_time_ms).toBe(300);

		// delayed_round2 total score: 3.0 * 1 + (5.0 * 1.1) * 2 = 14.0, total inference_time_ms: 150 + 900000 = 900150 (loses tie-breaker on inference time)
		expect(response.body.data[1].rank).toBe(2);
		expect(response.body.data[1].pseudonym).toBe("delayed_round2");
		expect(response.body.data[1].score).toBeCloseTo(14.0, 4);
		expect(response.body.data[1].inference_time_ms).toBe(900150);
	});

	it("should return 200 and list of finished rounds", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);

		const submissionId = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_1.id,
			"http://example.com/api",
			"pseudonym",
		);
		await createEvaluationEntryForLeaderboard(db, submissionId, 1, 5.0, "EVALUATED");
		await createEvaluationEntryForLeaderboard(db, submissionId, 2, 4.2, "EVALUATED");
		await createEvaluationEntryForLeaderboard(db, submissionId, 3, 0, "PENDING");

		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/leaderboard/rounds`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual([1, 2]);
	});

	it("should return 200 and personal round results for the logged-in user", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);

		const submissionId = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_1.id,
			"http://example.com/api",
			"my_pseudonym",
		);
		await createEvaluationEntryForLeaderboard(db, submissionId, 1, 3.5, "EVALUATED");
		await createEvaluationEntryForLeaderboard(db, submissionId, 2, 2.8, "DELAYED");

		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/results/me`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body).toHaveLength(2);
		expect(response.body[0]).toEqual(
			expect.objectContaining({
				round: 1,
				score: 3.5,
				status: "EVALUATED",
			}),
		);
		expect(response.body[1]).toEqual(
			expect.objectContaining({
				round: 2,
				score: 2.8,
				status: "DELAYED",
			}),
		);
	});

	it("should return 404 when requesting personal results if user has no evaluation entries", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);

		const response = await request(app)
			.get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/results/me`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(404);
	});
});
