import request from "supertest";
import http from "http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {
	createDatasetsForCompetitionRound,
	createTestDatabase,
	createTestSubmissionForUser,
	resetTestDatabase,
	TEST_COMPETITIONS,
	TEST_USERS,
} from "./helpers/testDb.helper";
import { createApp } from "../../src/createApp";
import { Database } from "sqlite";
import { Application } from "express";
import { generateTestToken } from "./helpers/auth.helper";
import path from "path";
import fs from "fs";

describe("Evaluation API integration test", () => {
	let db: Database;
	let app: Application;

	let mockStudentServer: http.Server;
	let lastReceivedPayload: any = null;

	const MOCK_STUDENT_SERVER_PORT = 9999;
	const MOCK_STUDENT_SERVER_URL = `http://127.0.0.1:${MOCK_STUDENT_SERVER_PORT}/api`;
	const ADMIN_TOKEN = generateTestToken(TEST_USERS.ADMIN.id);

	const TEST_DATASET_DIR = path.join(__dirname, "temp_test_datasets_evaluation_api");
	const TEST_COMPETITION_BASE_URL = "http://test-domain.de/api/competition";

	beforeAll(async () => {
		process.env.UPLOAD_DIR = TEST_DATASET_DIR; // temp directory for test dataset storage
		process.env.PUBLIC_COMPETITION_API_URL = `${TEST_COMPETITION_BASE_URL}`;
		// Initialize the database and application here
		db = await createTestDatabase();
		app = createApp(db);
		//start a mock student server to simulate the student API
		mockStudentServer = http.createServer((req, res) => {
			if (req.method === "POST" && req.url === "/api/predict") {
				let body = "";
				req.on("data", (chunk) => {
					body += chunk.toString();
				});
				req.on("end", () => {
					lastReceivedPayload = JSON.parse(body);
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ status: "accepted" }));
				});
			} else if (req.method === "GET" && req.url === "/api/health") {
                    res.writeHead(200, { "Content-Type": "application/json" });
				    res.end(JSON.stringify({ health: "up" }));
			} else {
				res.writeHead(404);
				res.end();
			}
		});
		await new Promise<void>((resolve) => {
			mockStudentServer.listen(MOCK_STUDENT_SERVER_PORT, "127.0.0.1", () => {
				resolve();
			});
		});
	});

	afterAll(async () => {
		mockStudentServer.close();
		// Clean up the temporary dataset directory after tests
		if (fs.existsSync(TEST_DATASET_DIR)) {
			fs.rmSync(TEST_DATASET_DIR, { recursive: true, force: true });
		}
		delete process.env.UPLOAD_DIR;
		await db.close();
	});

	beforeEach(async () => {
		// Reset the database state before each test
		await resetTestDatabase(db);
	});

	it("should start an evaluation and create evaluation records and send correct payload to student APIs", async () => {
		//arrange: create test data for the competition, submission, and datasets
		// Create a submission for the test
		const submissionId = await createTestSubmissionForUser(
			db,
			TEST_COMPETITIONS.COMPETITION_1.id,
			TEST_USERS.USER_PROJECT_1.id,
			MOCK_STUDENT_SERVER_URL,
			"pseudonym1",
		);
		// Create a datasets for round 1
		await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);

		//act: Start the evaluation
		const response = await request(app)
			.post("/evaluations/competitions/" + TEST_COMPETITIONS.COMPETITION_1.id + "/start?round=1")
			.set("Authorization", `Bearer ${ADMIN_TOKEN}`);

		expect(response.status).toBe(200);

		//assert:
       
		// Check that the evaluation record was created in the database
		const evaluationRecord: any = await db.get(
			`SELECT * FROM competition_evaluations AS e JOIN competition_submissions AS s ON e.submissionId = s.id WHERE competitionId = ? AND round = ?`,
			[TEST_COMPETITIONS.COMPETITION_1.id, 1],
		);
		expect(evaluationRecord).not.toBeUndefined();
		expect(evaluationRecord).toHaveProperty("token");
		const evaluationToken = evaluationRecord.token;

         // wait for asynchronous student API calls to complete
		await vi.waitFor(
			() => {
				expect(lastReceivedPayload).not.toBeNull();
			},
			{ timeout: 2000, interval: 50 },
		);
		
		// Check that the payload sent to the student API is correct
		expect(lastReceivedPayload).toHaveProperty("testdata_download_endpoint");
		expect(lastReceivedPayload.testdata_download_endpoint).toBe(
			`${TEST_COMPETITION_BASE_URL}/evaluations/${evaluationToken}/download`,
		);
		expect(lastReceivedPayload).toHaveProperty("prediction_upload_endpoint");
		expect(lastReceivedPayload.prediction_upload_endpoint).toBe(
			`${TEST_COMPETITION_BASE_URL}/evaluations/${evaluationToken}/upload`,
		);
	});

    it("should return 400 if round number is invalid when starting evaluation", async () => {
        const response = await request(app)
            .post("/evaluations/competitions/" + TEST_COMPETITIONS.COMPETITION_1.id + "/start?round=0")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("Invalid round number");
    });

    it("should return 404 if competition does not exist when starting evaluation", async () => {
        const response = await request(app)
            .post("/evaluations/competitions/9999/start?round=1") // Assuming 9999 is a non-existent competition ID
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("Competition not found");
    });

    it("should return 400 if competition is not active when starting evaluation", async () => {
        // First, set the competition to inactive
        const dateInPast = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // 1 day in the past
        await db.run(`UPDATE competitions SET end_date = ? WHERE id = ?`, [dateInPast, TEST_COMPETITIONS.COMPETITION_1.id]);

        const response = await request(app)
            .post("/evaluations/competitions/" + TEST_COMPETITIONS.COMPETITION_1.id + "/start?round=1")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("Competition is not currently active");
    });

    it("should download the input CSV for a valid evaluation token", async () => {
        // Arrange: Create a submission and evaluation for the test
        const submissionId = await createTestSubmissionForUser(
            db,
            TEST_COMPETITIONS.COMPETITION_1.id,
            TEST_USERS.USER_PROJECT_1.id,
            MOCK_STUDENT_SERVER_URL,
            "pseudonym1",
        );
        await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);
        const evaluationToken = crypto.randomUUID();
        await db.run(
            `INSERT INTO competition_evaluations (submissionId, round, token, status) VALUES (?, ?, ?, ?)`,
            [submissionId, 1, evaluationToken, "PENDING"],
        );

        // Act: Download the input CSV
        const response = await request(app)
            .get("/evaluations/" + evaluationToken + "/download")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toBe("text/csv");
        expect(response.headers["content-disposition"]).toContain("attachment; filename=\"input");
        expect(response.text).toContain("package_name,version,lines_of_code,has_cve"); // Input of csv data in createDatasetsForCompetitionRound
        // Check that the evaluation's started_at timestamp was updated
        const evaluationRecord: any = await db.get(
            `SELECT * FROM competition_evaluations WHERE token = ?`,
            [evaluationToken],
        );
        expect(evaluationRecord.started_at).not.toBeNull();
    });

    it("should return 400 when downloading input CSV with invalid token", async () => {
        const response = await request(app)
            .get("/evaluations/invalid-token/download")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("No evaluation entry found for the provided token");
    });

    it("should return 404 when downloading input CSV for existing evaluation with not PENDING status", async () => {
        // Arrange: Create a submission and evaluation for the test
        const submissionId = await createTestSubmissionForUser(
            db,
            TEST_COMPETITIONS.COMPETITION_1.id,
            TEST_USERS.USER_PROJECT_1.id,
            MOCK_STUDENT_SERVER_URL,
            "pseudonym1",
        );
        await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);
        const evaluationToken = crypto.randomUUID();
        await db.run(
            `INSERT INTO competition_evaluations (submissionId, round, token, status) VALUES (?, ?, ?, ?)`,
            [submissionId, 1, evaluationToken, "EVALUATED"],
        );

        // Act: Attempt to download the input CSV
        const response = await request(app)
            .get("/evaluations/" + evaluationToken + "/download")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("Evaluation entry is not in the expected status");
    });

    it("should upload and evaluate a student prediction successfully", async () => { 
        // Arrange: Create a submission and evaluation with PENDING status and started for the test
        const submissionId = await createTestSubmissionForUser(
            db,
            TEST_COMPETITIONS.COMPETITION_1.id,
            TEST_USERS.USER_PROJECT_1.id,
            MOCK_STUDENT_SERVER_URL,
            "pseudonym1",
        );
        await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);
        const evaluationToken = crypto.randomUUID();
        await db.run(
            `INSERT INTO competition_evaluations (submissionId, round, token, status, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [submissionId, 1, evaluationToken, "PENDING", new Date().toISOString(), new Date().toISOString()],
        );

        // Act: Upload a student prediction CSV
        const predictionCsvContent = ["package_name,version,lines_of_code,has_cve", // ground truth of createDatrsetsForCompetitionRound
		"express,4.18.2,1500,false",
		"lodash,4.17.21,8000,true",].join("\n");
        const response = await request(app)
            .post("/evaluations/" + evaluationToken + "/upload")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .attach("predictions", Buffer.from(predictionCsvContent), "prediction.csv");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("status");
        expect(response.body.status).toBe("EVALUATED");
        expect(response.body).toHaveProperty("score");
        expect(response.body.score).toBe(0); // Based on the provided ground truth and prediction, the score should be 0

        // Check that the evaluation record was updated with the score and status
        const evaluationRecord: any = await db.get(
            `SELECT * FROM competition_evaluations WHERE token = ?`,
            [evaluationToken],
        );
        expect(evaluationRecord.status).toBe("EVALUATED");
        expect(evaluationRecord.score).not.toBeNull();
        expect(evaluationRecord.score).toBe(0);
        expect(evaluationRecord.completed_at).not.toBeNull();
        expect(evaluationRecord.inference_time_ms).not.toBeNull();
        expect(evaluationRecord.error_message).toBeNull();

    });
    it("should return 400 when uploading a student prediction with invalid token", async () => {
        const predictionCsvContent = ["package_name,version,lines_of_code,has_cve",
        "express,4.18.2,1500,false",
        "lodash,4.17.21,8000,true",].join("\n");
        const response = await request(app)
            .post("/evaluations/invalid-token/upload")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .attach("predictions", Buffer.from(predictionCsvContent), "prediction.csv");
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("No evaluation entry found for the provided token");
    });

    it("should return 400 when uploading a student prediction for an evaluation not in PENDING status", async () => {
        // Arrange: Create a submission and evaluation with EVALUATED status for the test
        const submissionId = await createTestSubmissionForUser(
            db,
            TEST_COMPETITIONS.COMPETITION_1.id,
            TEST_USERS.USER_PROJECT_1.id,
            MOCK_STUDENT_SERVER_URL,
            "pseudonym1",
        );
        await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);
        const evaluationToken = crypto.randomUUID();
        await db.run(
            `INSERT INTO competition_evaluations (submissionId, round, token, status) VALUES (?, ?, ?, ?)`,
            [submissionId, 1, evaluationToken, "EVALUATED"],
        );

        // Act: Attempt to upload a student prediction CSV
        const predictionCsvContent = ["package_name,version,lines_of_code,has_cve",
        "express,4.18.2,1500,false",
        "lodash,4.17.21,8000,true",].join("\n");
        const response = await request(app)
            .post("/evaluations/" + evaluationToken + "/upload")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .attach("predictions", Buffer.from(predictionCsvContent), "prediction.csv");

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("Evaluation entry is not in the expected status");
    });
    it("should return 400 when uploading a student prediction with invalid CSV format", async () => {
        // Arrange: Create a submission and evaluation with PENDING status for the test
        const submissionId = await createTestSubmissionForUser(
            db,
            TEST_COMPETITIONS.COMPETITION_1.id,
            TEST_USERS.USER_PROJECT_1.id,
            MOCK_STUDENT_SERVER_URL,
            "pseudonym1",
        );
        await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);
        const evaluationToken = crypto.randomUUID();
        await db.run(
            `INSERT INTO competition_evaluations (submissionId, round, token, status) VALUES (?, ?, ?, ?)`,
            [submissionId, 1, evaluationToken, "PENDING"],
        );

        // Act: Attempt to upload an invalid student prediction CSV
        const invalidPredictionCsvContent = ["package_name,version,lines_of_code", // Missing 'has_cve' column
        "express,4.18.2,1500",
        "lodash,4.17.21,8000",].join("\n");
        const response = await request(app)
            .post("/evaluations/" + evaluationToken + "/upload")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .attach("predictions", Buffer.from(invalidPredictionCsvContent), "prediction.csv");

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Invalid request: Column count mismatch");
    });
    it("should return 200 and det DELAYED status if evaluation takes too long", async () => {
        // Arrange: Create a submission and evaluation with PENDING status for the test
        const submissionId = await createTestSubmissionForUser(
            db,
            TEST_COMPETITIONS.COMPETITION_1.id,
            TEST_USERS.USER_PROJECT_1.id,
            MOCK_STUDENT_SERVER_URL,
            "pseudonym1",
        );
        await createDatasetsForCompetitionRound(db, TEST_COMPETITIONS.COMPETITION_1.id, 1, TEST_DATASET_DIR);
        const evaluationToken = crypto.randomUUID();
        // Insert an evaluation record with a created_at timestamp set to 20 minutes ago
        await db.run(
            `INSERT INTO competition_evaluations (submissionId, round, token, status, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [submissionId, 1, evaluationToken, "PENDING", new Date(Date.now() - 19 * 60 * 1000).toISOString(), new Date(Date.now() - 20 * 60 * 1000).toISOString()],
        );
        // Act: Upload a student prediction CSV
        const predictionCsvContent = ["package_name,version,lines_of_code,has_cve",
        "express,4.18.2,1500,false",
        "lodash,4.17.21,8000,true",].join("\n");
        const response = await request(app)
            .post("/evaluations/" + evaluationToken + "/upload")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .attach("predictions", Buffer.from(predictionCsvContent), "prediction.csv");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("status");
        expect(response.body.status).toBe("DELAYED");
        // Check that the evaluation record was updated with the DELAYED status
        const evaluationRecord: any = await db.get(
            `SELECT * FROM competition_evaluations WHERE token = ?`,
            [evaluationToken],
        );
        expect(evaluationRecord.status).toBe("DELAYED");
        expect(evaluationRecord.score).toBe(0);
        expect(evaluationRecord.completed_at).not.toBeNull();
        expect(evaluationRecord.inference_time_ms).not.toBeNull();
        expect(evaluationRecord.error_message).toBeNull();
    });
});