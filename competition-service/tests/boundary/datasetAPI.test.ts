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
	const TEST_DATASET_DIR = path.join(__dirname, "temp_test_datasets");
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
		process.env.UPLOAD_DIR = TEST_DATASET_DIR;
		db = await createTestDatabase();
		app = createApp(db);
		fs.writeFileSync(validCsvPath, validCsvContent);
		fs.writeFileSync(invalidCsvPath, invalidCsvContent);
	});

	afterAll(async () => {
		if (fs.existsSync(validCsvPath)) fs.unlinkSync(validCsvPath);
		if (fs.existsSync(invalidCsvPath)) fs.unlinkSync(invalidCsvPath);

		if(fs.existsSync(TEST_DATASET_DIR)) {
			fs.rmSync(TEST_DATASET_DIR, { recursive: true, force: true });
		}
		delete process.env.UPLOAD_DIR;
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
			.post(`/competitions/${competitionId}/datasets/train`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", validCsvPath);

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body).toHaveProperty("id");
		expect(uploadResponse.body).toHaveProperty("file_name", "valid_dummy_dataset.csv");
		expect(uploadResponse.body.dataset_type).toBe("TRAIN");

		const dbrecord = await db.get("SELECT * FROM competition_datasets WHERE id = ?", uploadResponse.body.id);
		expect(dbrecord).toBeDefined();
		expect(dbrecord.file_name).toBe("valid_dummy_dataset.csv");
		expect(dbrecord.dataset_type).toBe("TRAIN");

		// Now test downloading the dataset
		const downloadResponse = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=TRAIN`)
			.set("Authorization", `Bearer ${token}`);

		expect(downloadResponse.status).toBe(200);
		expect(downloadResponse.header["content-type"]).toContain("text/csv");
		expect(downloadResponse.text).toBe(validCsvContent);
	});

	it("should allow admin users to download INPUT and GROUND_TRUTH datasets", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		// upload round datasets for round 1
		await request(app)
			.post(`/competitions/${competitionId}/datasets?round=1`)
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath)
			.attach("groundTruthFile", validCsvPath);

		// get INPUT Dataset
		const inputRes = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=INPUT&round=1`)
			.set("Authorization", `Bearer ${token}`);
		expect(inputRes.status).toBe(200);
		expect(inputRes.text).toBe(validCsvContent);

		//get GROUND_TRUTH Dataset
		const gtRes = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=GROUND_TRUTH&round=1`)
			.set("Authorization", `Bearer ${token}`);
		expect(gtRes.status).toBe(200);
		expect(gtRes.text).toBe(validCsvContent);
	});

	it("should return 403 when trying to download a INPUT or GROUND_TRUTH dataset over general Endpoint as a non-admin user", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const downloadResponseINPUT = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=INPUT&round=1`)
			.set("Authorization", `Bearer ${token}`);

		const downloadResponseGROUND_TRUTH = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=GROUND_TRUTH&round=1`)
			.set("Authorization", `Bearer ${token}`);

		expect(downloadResponseINPUT.status).toBe(403);
		expect(downloadResponseINPUT.body).toHaveProperty("message", "Not allowed to download this type of dataset.");

		expect(downloadResponseGROUND_TRUTH.status).toBe(403);
		expect(downloadResponseGROUND_TRUTH.body).toHaveProperty("message", "Not allowed to download this type of dataset.");
	});

	it("should return 400 when uploading without a file", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets/train`)
			.set("Authorization", `Bearer ${token}`); // No file attached

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message", "No file uploaded");
	});

	it("should return 400 when downloading with an invalid dataset type", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=INVALID_TYPE`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("Validation failed");
		expect(response.body).toHaveProperty("error", "Bad Request");
	});

	it("should return 400 when admin downloads INPUT dataset without valid round", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		// without round parameter
		const resNoRound = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=INPUT`)
			.set("Authorization", `Bearer ${token}`);
		expect(resNoRound.status).toBe(400);
		expect(resNoRound.body.message).toContain("round request parameter is required");

		// with invalid round (<= 0)
		const resInvalidRound = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=INPUT&round=0`)
			.set("Authorization", `Bearer ${token}`);
		expect(resInvalidRound.status).toBe(400);
	});

	it("should upload both INPUT and GROUND_TRUTH datasets for a competition round and verify no filename collision", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const round = 1;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets?round=${round}`)
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath)
			.attach("groundTruthFile", validCsvPath);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("datasets");
		expect(response.body.datasets).toHaveLength(2);

		const inputDataset = response.body.datasets.find((d: any) => d.dataset_type === "INPUT");
		const groundTruthDataset = response.body.datasets.find((d: any) => d.dataset_type === "GROUND_TRUTH");
		expect(inputDataset).toBeDefined();
		expect(groundTruthDataset).toBeDefined();
		expect(inputDataset.file_name).toBe("valid_dummy_dataset.csv");
		expect(groundTruthDataset.file_name).toBe("valid_dummy_dataset.csv");
		expect(inputDataset.id).not.toBe(groundTruthDataset.id); // Ensure different IDs

		// ensure that the file paths are different to avoid filename collision
		const dbrecordInput = await db.get("SELECT * FROM competition_datasets WHERE id = ?", inputDataset.id);
		const dbrecordGroundTruth = await db.get("SELECT * FROM competition_datasets WHERE id = ?", groundTruthDataset.id);

		expect(dbrecordInput.file_path).not.toBe(dbrecordGroundTruth.file_path);
	});

	it("should return 404 when downloading a dataset that has not been uploaded yet", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_2.id; // No datasets uploaded for this competition yet

		const response = await request(app)
			.get(`/competitions/${competitionId}/datasets/download?type=TRAIN`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(404);
	});

	it("should return 400 when uploading a round dataset with wrong body file names", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const round = 1;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets?round=${round}`)
			.set("Authorization", `Bearer ${token}`)
			.attach("wrongInputFile", validCsvPath)
			.attach("wrongGroundTruthFile", validCsvPath);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("Unexpected file field:");
		expect(response.body).toHaveProperty("error", "Bad Request");
	});

	it("prohibits non-admin users from uploading round datasets (INPUT, GROUND_TRUTH)", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const round = 1;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets?round=${round}`)
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath)
			.attach("groundTruthFile", validCsvPath);

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("User is not an admin");
	});

	it("should reject round dataset upload with missing GROUND_TRUTH dataset for a round and no dataset is stored", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const round = 1;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets?round=${round}`)
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("File missing, please upload both input and ground truth files");
	});

	it("should reject round dataset upload with missing INPUT dataset for a round and no dataset is stored", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const round = 1;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets?round=${round}`)
			.set("Authorization", `Bearer ${token}`)
			.attach("groundTruthFile", validCsvPath);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("File missing, please upload both input and ground truth files");
	});

	it("should return 404 for non existing competition ID when uploading round datasets or training datasets", async () => {
		const invalidCompetitionId = 9999; // Assuming this ID does not exist
		const token = generateTestToken(TEST_USERS.ADMIN.id);

		const uploadResponseTrain = await request(app)
			.post(`/competitions/${invalidCompetitionId}/datasets/train`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", validCsvPath);

		const uploadResponseRound = await request(app)
			.post(`/competitions/${invalidCompetitionId}/datasets?round=1`)
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath)
			.attach("groundTruthFile", validCsvPath);

		expect(uploadResponseTrain.status).toBe(404);
		expect(uploadResponseTrain.body).toHaveProperty("message", "Competition not found");

		expect(uploadResponseRound.status).toBe(404);
		expect(uploadResponseRound.body).toHaveProperty("message", "Competition not found");
	});

	it("should return 400 if round is not specified when uploading round datasets (INPUT, GROUND_TRUTH)", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets`) // No round specified
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath)
			.attach("groundTruthFile", validCsvPath);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("Invalid round number");
		expect(response.body).toHaveProperty("error", "Bad Request");
	});

	it("should delete a training dataset by ID and verify it is removed from the database", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		// First, upload a TRAIN dataset to have a dataset to delete
		const uploadResponse = await request(app)
			.post(`/competitions/${competitionId}/datasets/train`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", validCsvPath);

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body).toHaveProperty("id");

		// Now, delete the uploaded dataset
		const deleteResponse = await request(app)
			.delete(`/competitions/${competitionId}/datasets/${uploadResponse.body.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(deleteResponse.status).toBe(204); // No Content
		// Verify that the dataset is removed from the database
		const dbrecord = await db.get("SELECT * FROM competition_datasets WHERE id = ?", uploadResponse.body.id);
		expect(dbrecord).toBeUndefined();
	});

	it("should delete a round dataset by ID and verify it is removed from the database but other round dataset is not affected", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const round = 1;

		// First, upload both INPUT and GROUND_TRUTH datasets for a round
		const uploadResponse = await request(app)
			.post(`/competitions/${competitionId}/datasets?round=${round}`)
			.set("Authorization", `Bearer ${token}`)
			.attach("inputFile", validCsvPath)
			.attach("groundTruthFile", validCsvPath);

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body).toHaveProperty("datasets");
		expect(uploadResponse.body.datasets).toHaveLength(2);

		const inputDataset = uploadResponse.body.datasets.find((d: any) => d.dataset_type === "INPUT");
		const groundTruthDataset = uploadResponse.body.datasets.find((d: any) => d.dataset_type === "GROUND_TRUTH");

		expect(inputDataset).toBeDefined();
		expect(groundTruthDataset).toBeDefined();

		// Now, delete the INPUT dataset
		const deleteResponse = await request(app)
			.delete(`/competitions/${competitionId}/datasets/${inputDataset.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(deleteResponse.status).toBe(204); // No Content

		// Verify that the INPUT dataset is removed from the database
		const dbrecordInput = await db.get("SELECT * FROM competition_datasets WHERE id = ?", inputDataset.id);
		expect(dbrecordInput).toBeUndefined();

		// Verify that the GROUND_TRUTH dataset is still present in the database
		const dbrecordGroundTruth = await db.get("SELECT * FROM competition_datasets WHERE id = ?", groundTruthDataset.id);
		expect(dbrecordGroundTruth).toBeDefined();
	});

	it("should return 400 when trying to delete with a non-numeric dataset ID", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		const response = await request(app)
			.delete(`/competitions/${competitionId}/datasets/invalid-id`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("Invalid dataset ID");
	});

	it("should reject delete as student user and return 403", async () => {
		const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		// First, upload a TRAIN dataset to have a dataset to delete
		const uploadResponse = await request(app)
			.post(`/competitions/${competitionId}/datasets/train`)
			.set("Authorization", `Bearer ${generateTestToken(TEST_USERS.ADMIN.id)}`)
			.attach("dataset", validCsvPath);

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body).toHaveProperty("id");

		// Now, attempt to delete the uploaded dataset as a student user
		const deleteResponse = await request(app)
			.delete(`/competitions/${competitionId}/datasets/${uploadResponse.body.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(deleteResponse.status).toBe(403);
		expect(deleteResponse.body).toHaveProperty("message");
		expect(deleteResponse.body.message).toContain("User is not an admin");
	});

	it("should return 404 when trying to delete a non-existing dataset", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;
		const nonExistingDatasetId = 9999; // Assuming this ID does not exist

		const deleteResponse = await request(app)
			.delete(`/competitions/${competitionId}/datasets/${nonExistingDatasetId}`)
			.set("Authorization", `Bearer ${token}`);

		expect(deleteResponse.status).toBe(404);
		expect(deleteResponse.body).toHaveProperty("message", "Dataset not found");
	});

	it("should reject non-CSV data uploads via multer and return a 400 error", async () => {
		const token = generateTestToken(TEST_USERS.ADMIN.id);
		const competitionId = TEST_COMPETITIONS.COMPETITION_1.id;

		// Create a dummy non-CSV file for testing
		const dummyFilePath = path.join(__dirname, "dummy.txt");
		fs.writeFileSync(dummyFilePath, "This is a dummy text file.");

		const response = await request(app)
			.post(`/competitions/${competitionId}/datasets/train`)
			.set("Authorization", `Bearer ${token}`)
			.attach("dataset", dummyFilePath);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("This file format is not allowed. Please upload only CSV files.");

		// Clean up the dummy file
		if (fs.existsSync(dummyFilePath)) {
			fs.unlinkSync(dummyFilePath);
		}
	});
});
