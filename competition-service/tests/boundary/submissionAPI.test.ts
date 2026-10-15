import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Database } from "sqlite";
import {
	createTestDatabase,
	createTestSubmissionForUser,
	resetTestDatabase,
	TEST_COMPETITIONS,
	TEST_USERS,
} from "./helpers/testDb.helper";
import { generateTestToken } from "./helpers/auth.helper";
import { createApp } from "../../src/createApp";
import { Application } from "express";
import http from "http";

describe("Submission API integration test", () => {
	let db: Database;
	let app: Application;

	let mockStudentServer: http.Server;
	let healthCheckCalledCounter = 0;

	const MOCK_STUDENT_API_PORT = 9998;
	const MOCK_STUDENT_API_BASE_URL = `http://127.0.0.1:${MOCK_STUDENT_API_PORT}/api`;

	beforeAll(async () => {
		// Initialize the database and application here
		db = await createTestDatabase();
		app = createApp(db);
		mockStudentServer = http.createServer((req, res) => {
			if (req.method === "GET" && req.url === "/api/health") {
				healthCheckCalledCounter++;
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ health: "up" }));
			} else {
				res.writeHead(404);
				res.end();
			}
		});
		await new Promise<void>((resolve) => {
			mockStudentServer.listen(MOCK_STUDENT_API_PORT, "127.0.0.1", () => {
				resolve();
			});
		});
	});

	afterAll(async () => {
		mockStudentServer.close();
		await db.close();
	});

	beforeEach(async () => {
		// Reset the database state before each test
		await resetTestDatabase(db);
    healthCheckCalledCounter = 0;
	});

	it("should create a new submission for a competition", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		const sentApiUrl = MOCK_STUDENT_API_BASE_URL;
		const response = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: sentApiUrl,
				pseudonym: "test-pseudonym",
			});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("id");
		expect(response.body).toHaveProperty("competitionId", competitionId);
		expect(response.body).toHaveProperty("userId", userId);
		expect(response.body).toHaveProperty("apiUrl", sentApiUrl);
		expect(response.body).toHaveProperty("pseudonym", "test-pseudonym");
		expect(healthCheckCalledCounter).toBe(1);
	});

	it("should update an existing submission url for a competition", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		// First, create a submission
		await createTestSubmissionForUser(db, competitionId, userId, "http://example.com/api", "test-pseudonym");

		// Now, update the submission
		const updateResponse = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: MOCK_STUDENT_API_BASE_URL,
				pseudonym: "test-pseudonym",
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body).toHaveProperty("id");
		expect(updateResponse.body).toHaveProperty("competitionId", competitionId);
		expect(updateResponse.body).toHaveProperty("userId", userId);
		expect(updateResponse.body).toHaveProperty("apiUrl", MOCK_STUDENT_API_BASE_URL);
		expect(updateResponse.body).toHaveProperty("pseudonym", "test-pseudonym");
		expect(healthCheckCalledCounter).toBe(1);
	});

	it("should update an existing submission with new pseudonym for a competition", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		// First, create a submission
		await createTestSubmissionForUser(db, competitionId, userId, MOCK_STUDENT_API_BASE_URL, "test-pseudonym");

		// Now, update the submission
		const updateResponse = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: MOCK_STUDENT_API_BASE_URL,
				pseudonym: "test-pseudonym-updated",
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body).toHaveProperty("id");
		expect(updateResponse.body).toHaveProperty("competitionId", competitionId);
		expect(updateResponse.body).toHaveProperty("userId", userId);
		expect(updateResponse.body).toHaveProperty("apiUrl", MOCK_STUDENT_API_BASE_URL);
		expect(updateResponse.body).toHaveProperty("pseudonym", "test-pseudonym-updated");
		expect(healthCheckCalledCounter).toBe(1);
	});

	it("should return 404 for non existing competition ID", async () => {
		const invalidCompetitionId = 9999; // Assuming this ID does not exist
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		const response = await request(app)
			.put(`/competitions/${invalidCompetitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: MOCK_STUDENT_API_BASE_URL,
				pseudonym: "test-pseudonym",
			});

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("message", "Competition not found");
	});

	it("should return 400 for invalid submission data", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		const response = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: "", // Invalid URL
				pseudonym: "test-pseudonym",
			});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("Validation failed");
		expect(response.body).toHaveProperty("error", "Bad Request");
	});

	it("should return 400 if the health check endpoint of the provided apiUrl is not reachable", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		const response = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: "http://invalid-url-for-testing.com", // Invalid URL for testing
				pseudonym: "test-pseudonym",
			});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("provided API-Url is not reachable");
		expect(response.body).toHaveProperty("error", "Bad Request");
	});

	it("should return 401 for unauthorized access", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app).put(`/competitions/${competitionId}/submissions`).send({
			apiUrl: "http://example.com/api",
		});

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("message", "No token provided");
	});
	it("should return 403 for user not in course associated to competition", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_2.id;
		const token = generateTestToken(userId);

		const response = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				apiUrl: "http://example.com/api",
			});

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("message", "User is not a member of the course associated with this competition");
	});

	it("should retrieve the user's submission for a competition", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		// First, create a submission for the user
		await createTestSubmissionForUser(db, competitionId, userId, "http://example.com/api", "test-pseudonym");

		const response = await request(app)
			.get(`/competitions/${competitionId}/submissions/me`)
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);

		expect(response.body).toHaveProperty("id");
		expect(response.body).toHaveProperty("competitionId", competitionId);
		expect(response.body).toHaveProperty("userId", userId);
		expect(response.body).toHaveProperty("apiUrl", "http://example.com/api");
		expect(response.body).toHaveProperty("pseudonym", "test-pseudonym");
	});

	it("should return 404 if the user has no submission for the competition", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id; // This user has no submission for the competition
		const token = generateTestToken(userId);

		const response = await request(app)
			.get(`/competitions/${competitionId}/submissions/me`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("message", "No Submission found for logged-in user");
	});

	it("should return 401 for unauthorized access to GET /competitions/:id/submissions/me", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		await request(app)
			.get(`/competitions/${competitionId}/submissions/me`)
			.expect(401)
			.then((response) => {
				expect(response.body).toHaveProperty("message", "No token provided");
			});
	});

	it("should return 403 for forbidden access to GET /competitions/:id/submissions/me", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_2.id; // This user is not part of the competition
		const token = generateTestToken(userId);

		const response = await request(app)
			.get(`/competitions/${competitionId}/submissions/me`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("error", "Forbidden");
		expect(response.body).toHaveProperty("message", "User is not a member of the course associated with this competition");
	});

	it("should call health endpoint of the provided apiUrl when creating a submission regardless if apiUrl ends with / or not", async () => {
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const userId = TEST_USERS.USER_PROJECT_1.id;
		const token = generateTestToken(userId);

		const MOCK_STUDENT_API_BASE_URL_WITH_TRAILING_SLASH = `${MOCK_STUDENT_API_BASE_URL}/`;

		const submissionData = {
			apiUrl: MOCK_STUDENT_API_BASE_URL,
			pseudonym: "test-pseudonym",
		};

		const response = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send(submissionData);

		const submissionDataWithTrailingSlash = {
			apiUrl: MOCK_STUDENT_API_BASE_URL_WITH_TRAILING_SLASH,
			pseudonym: "test-pseudonym",
		};

		const responseWithTrailingSlash = await request(app)
			.put(`/competitions/${competitionId}/submissions`)
			.set("Authorization", `Bearer ${token}`)
			.send(submissionDataWithTrailingSlash);

		expect(response.status).toBe(200);
		expect(responseWithTrailingSlash.status).toBe(200);
		expect(healthCheckCalledCounter).toBe(2);
	});
});
