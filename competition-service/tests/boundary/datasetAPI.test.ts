import { Database } from "sqlite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createTestDatabase, resetTestDatabase, TEST_COMPETITIONS, TEST_USERS } from "./helpers/testDb.helper";
import path from "path";
import fs from "fs";
import { generateTestToken } from "./helpers/auth.helper";
import { createApp } from "../../src/createApp";
import { Application } from "express";

describe("Dataset API Integrationtest", () => {
	let db: Database;
	let app: Application;
	const createdFilePaths: string[] = []; // Store created dataset file paths for cleanup

	const validCsvPath = path.join(__dirname, "valid_dummy_dataset.csv");
	const invalidCsvPath = path.join(__dirname, "invalid_dummy_dataset.csv");

	const validCsvContent = [
		"package_name,version,lines_of_code,has_cve",
		"express,4.18.2,1500,false",
		"lodash,4.17.21,8000,true",
	].join("\n");

	const invalidCsvContent = ["package_name,version", "express,4.18.2"].join("\n");

	beforeAll(async () => {
		// Initialize the database and application here
		db = await createTestDatabase();
		app = createApp(db);
		fs.writeFileSync(validCsvPath, validCsvContent);
		fs.writeFileSync(invalidCsvPath, invalidCsvContent);
	});

	afterAll(async () => {
		if (fs.existsSync(validCsvPath)) fs.unlinkSync(validCsvPath);
		if (fs.existsSync(invalidCsvPath)) fs.unlinkSync(invalidCsvPath);

		for (const filePath of createdFilePaths) {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath); // Delete the uploaded dataset file after tests
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
			.attach("dataset", validCsvPath)
			.field("type", "TRAIN");

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body).toHaveProperty("id");
		expect(uploadResponse.body).toHaveProperty("file_name", "valid_dummy_dataset.csv");
		expect(uploadResponse.body.dataset_type).toBe("TRAIN");

		const dbrecord = await db.get("SELECT * FROM competition_datasets WHERE id = ?", uploadResponse.body.id);
		expect(dbrecord).toBeDefined();
		expect(dbrecord.file_name).toBe("valid_dummy_dataset.csv");
		expect(dbrecord.dataset_type).toBe("TRAIN");
		if (dbrecord?.file_path) {
			createdFilePaths.push(dbrecord.file_path); // Store the created dataset file path for cleanup
		}

		// Now test downloading the dataset
		const downloadResponse = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=TRAIN`)
			.set("Authorization", `Bearer ${token}`);

		expect(downloadResponse.status).toBe(200);
		expect(downloadResponse.header["content-type"]).toContain("text/csv");
		expect(downloadResponse.text).toBe(validCsvContent);
	});

	it("should return 400 when uploading a dataset with missing required columns", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", invalidCsvPath)
			.field("type", "TRAIN");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		// check that the message indicates missing required columns
		expect(response.body.message.toLowerCase()).toContain("missing");
	});

	it("should return 400 when trying to download a TEST or VALIDATION dataset over general Endpoint as a non-admin user", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const downloadResponseTEST = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=TEST`)
			.set("Authorization", `Bearer ${token}`);

		const downloadResponseVALIDATION = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=VALIDATION`)
			.set("Authorization", `Bearer ${token}`);

		expect(downloadResponseTEST.status).toBe(403);
		expect(downloadResponseTEST.body).toHaveProperty("message", "Not allowed to download this type of dataset.");

		expect(downloadResponseVALIDATION.status).toBe(403);
		expect(downloadResponseVALIDATION.body).toHaveProperty("message", "Not allowed to download this type of dataset.");
	});

	it("should return 400 when uploading without a file", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets`)
			.set("Authorization", `Bearer ${token}`)
			.field("type", "TRAIN"); // No file attached
		console.log("Response body for no file upload:", response.body); // Log the response body for debugging
		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message", "No file uploaded");
	});

	it("should return 400 when uploading with an invalid dataset type", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", validCsvPath)
			.field("type", "INVALID_TYPE");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("Validation failed");
		expect(response.body).toHaveProperty("error", "Bad Request");
	});
});
