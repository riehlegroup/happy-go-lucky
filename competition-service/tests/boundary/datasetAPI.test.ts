import { Database } from "sqlite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import { createCompetitionRouter } from "../../src/routes/competition.routes";
import {
	createTestDatabase,
	resetTestDatabase,
	TEST_COMPETITIONS,
	TEST_USERS,
} from "./helpers/testDb.helper";
import path from "path";
import fs from "fs";
import { generateTestToken } from "./helpers/auth.helper";

describe("Dataset API Integrationtest", () => {
	let db: Database;
	let app: Express;
	const createdDatasetIds: number[] = []; // Store created dataset IDs for cleanup
	const dummyFilePath = path.join(__dirname, "dummy_dataset.csv");

	beforeAll(async () => {
		// Initialize the database and application here
		db = await createTestDatabase();
		app = express();
		app.use(express.json());
		app.use("/competitions", createCompetitionRouter(db));
		fs.writeFileSync(dummyFilePath, "id, name\n1, John\n2, Jane\n"); // Create a dummy file to test the upload
	});

	afterAll(async () => {
		if (fs.existsSync(dummyFilePath)) {
			fs.unlinkSync(dummyFilePath); // Delete the dummy file after tests
		}

		for (const datasetId of createdDatasetIds) {
			try {
				const dataset = await db.get(
					"SELECT file_path FROM competition_datasets WHERE id = ?",
					[datasetId],
				);
				if (dataset && fs.existsSync(dataset.file_path)) {
					fs.unlinkSync(dataset.file_path); // Delete the uploaded dataset file after tests
				}
			} catch (error) {
				console.error(
					`Error deleting dataset file for dataset ID in Cleanup ${datasetId}:`,
					error,
				);
			}
		}
		db.close();
	});

	beforeEach(async () => {
		// Reset the database state before each test
		await resetTestDatabase(db);
	});

	// ----- Test cases for the Dataset API endpoints will go here -----
	it("should upload a TRAIN dataset and download it again", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const uploadResponse = await request(app)
			.post(`/competitions/${competitionId}/datasets`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", dummyFilePath)
			.field("type", "TRAIN");

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body).toHaveProperty("id");
		expect(uploadResponse.body).toHaveProperty(
			"file_name",
			"dummy_dataset.csv",
		);
		expect(uploadResponse.body.dataset_type).toBe("TRAIN");

		createdDatasetIds.push(uploadResponse.body.id); // Store the created dataset ID for cleanup

		// Now test downloading the dataset
		const downloadResponse = await request(app)
			.get(`/competitions/${competitionId}/datasets?type=TRAIN`)
			.set("Authorization", `Bearer ${token}`);

		expect(downloadResponse.status).toBe(200);
		expect(downloadResponse.header["content-type"]).toContain("text/csv");
		expect(downloadResponse.text).toBe("id, name\n1, John\n2, Jane\n");
	});

	it("should return 400 when trying to download a TEST dataset over general Enpoint", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);	
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const downloadResponse = await request(app)
			.get(`/competitions/${competitionId}/datasets?type=TEST`)
			.set("Authorization", `Bearer ${token}`);

		expect(downloadResponse.status).toBe(400);
		expect(downloadResponse.body).toHaveProperty("success", false);
		expect(downloadResponse.body).toHaveProperty("error", "Invalid dataset type. Must be 'TRAIN' or 'VALIDATION'.");
	});

	it("should return 400 when uploading without a file", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets`)
			.set("Authorization", `Bearer ${token}`)
			.field("type", "TRAIN"); // No file attached

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error", "No file uploaded");
	});

	it("should return 400 when uploading with an invalid dataset type", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", dummyFilePath)
			.field("type", "INVALID_TYPE"); 

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("success", false);
	});

});