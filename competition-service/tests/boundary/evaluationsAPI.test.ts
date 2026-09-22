import { Database } from "sqlite";
import http from "http";
import request from "supertest";
import {createApp} from "../../src/createApp";
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from "vitest";
import { createTestDatabase, createTestDatasetForCompetition, createTestSubmissionForUser, resetTestDatabase, TEST_COMPETITIONS, TEST_USERS } from "./helpers/testDb.helper";
import { generateTestToken } from "./helpers/auth.helper";
import { DatasetPathResolver } from "../../src/services/datasetpath.resolver";
import { Application } from "express";
import path from "path";
import fs from "fs";
import { groundTruthCache } from "../../src/services/groundtruth.cache";

describe("Evaluation Integrationtest", () => {
    let app: Application;
    let db: Database;

    let mockStudentServer: http.Server;
    let lastReceivedPayload: any = null;
    let createdDatasetId: number | null = null; // Store created dataset ID for cleanup

    const MOCK_STUDENT_PORT = 9999;
    const MOCK_STUDENT_API_URL = `http://localhost:${MOCK_STUDENT_PORT}/api/predict`;
    const rawCsvPath = path.join(__dirname, "test_orignial.csv"); // Path to the raw test CSV file as in test db test data
    const adminToken = generateTestToken(TEST_USERS.ADMIN.id);

    beforeAll(async () => {
    
    db = await createTestDatabase();
    app = createApp(db);

    // ensure storage directories exist
    DatasetPathResolver.ensureBasePathExists();
    fs.mkdirSync(path.dirname(rawCsvPath), { recursive: true });

    // start mock student server
    mockStudentServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        lastReceivedPayload = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "acknowledged" }));
      });
    });

    await new Promise<void>(resolve => mockStudentServer.listen(MOCK_STUDENT_PORT, resolve));
  });

  afterAll(async () => {
    mockStudentServer.close();
    if (fs.existsSync(rawCsvPath)) fs.unlinkSync(rawCsvPath);
    await db.close();
  });

  beforeEach(async () => {
    await resetTestDatabase(db);
    lastReceivedPayload = null;
    groundTruthCache.delete(TEST_COMPETITIONS.COMPETITION_1.id);

    // create a dummy CSV file to simulate the original dataset for the competition
    const csvContent = [
      "package_name,version,lines_of_code,has_cve",
      "express,4.18.2,1500,false",
      "lodash,4.17.21,8000,true"
    ].join("\n");
    fs.writeFileSync(rawCsvPath, csvContent);
  });

  afterEach(async () => {
    if (createdDatasetId !== null) {
      await DatasetPathResolver.deleteGeneratedDatasetFiles(TEST_COMPETITIONS.COMPETITION_1.id, createdDatasetId);
    }
  });
describe("Happy Path Flow", () => {
    it("should split dataset, ping student API, serve input CSV and update started_at", async () => {
      const datasetId = await createTestDatasetForCompetition(db, TEST_COMPETITIONS.COMPETITION_1.id, rawCsvPath);
      createdDatasetId = datasetId;
      await createTestSubmissionForUser(db, TEST_COMPETITIONS.COMPETITION_1.id, TEST_USERS.USER_PROJECT_1.id, MOCK_STUDENT_API_URL);

      //admin starts evaluation for the competition

      const triggerRes = await request(app)
        .post(`/evaluations/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/start?datasetType=TEST`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(triggerRes.body.message).toContain("started");

      // check dataset splitting and input CSV generation
      const inputPath = DatasetPathResolver.getInputCsvPath(TEST_COMPETITIONS.COMPETITION_1.id, datasetId);
      expect(fs.existsSync(inputPath)).toBe(true);

      const inputCsv = fs.readFileSync(inputPath, "utf-8");
      expect(inputCsv).toContain("id,package_name,version,lines_of_code");
      expect(inputCsv).not.toContain("has_cve"); // Ground Truth muss abgetrennt sein

      const cachedGroundTruth = groundTruthCache.get(TEST_COMPETITIONS.COMPETITION_1.id);
      expect(cachedGroundTruth?.get("1")).toEqual({ has_cve: "false" });
      expect(cachedGroundTruth?.get("2")).toEqual({ has_cve: "true" });

      // wait a bit for the async student API call to be made
      await new Promise(r => setTimeout(r, 200));

      // check payload received by mock student API
      expect(lastReceivedPayload).not.toBeNull();
      expect(lastReceivedPayload.TestDataDownloadEndpoint).toBeDefined();

      // extract token from the download URL
      const downloadUrl: string = lastReceivedPayload.TestDataDownloadEndpoint;
      const tokenMatch = downloadUrl.match(/\/evaluations\/([^/]+)\/download/);
      expect(tokenMatch).not.toBeNull();
      const token = tokenMatch![1];

      // check that the evaluation entry in the database has status PENDING and started_at is null before download
      const evalBefore = await db.get("SELECT * FROM competition_evaluations WHERE token = ?", [token]);
      expect(evalBefore.status).toBe("PENDING");
      expect(evalBefore.started_at).toBeNull();

      // student downloads the input CSV using the token
      const downloadRes = await request(app)
        .get(`/evaluations/${token}/download`)
        .expect(200);

      expect(downloadRes.headers["content-type"]).toContain("text/csv");
      expect(downloadRes.text).toContain("express");
      expect(downloadRes.text).toContain("lodash");

      // started_at should now be set in the database after the download
      const evalAfter = await db.get("SELECT * FROM competition_evaluations WHERE token = ?", [token]);
      expect(evalAfter.started_at).not.toBeNull();

      // if student downloads again, started_at should remain unchanged
      const firstStartedAt = evalAfter.started_at;
      await request(app).get(`/evaluations/${token}/download`).expect(200);

      const evalSecond = await db.get("SELECT * FROM competition_evaluations WHERE token = ?", [token]);
      expect(evalSecond.started_at).toBe(firstStartedAt);
    });
  });

  describe("Edge Cases & Security", () => {
    it("should return 400 if datasetType query parameter is missing", async () => {
      await request(app)
        .post(`/evaluations/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/start`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should reject download with invalid token", async () => {
      await request(app)
        .get(`/evaluations/00000000-0000-0000-0000-000000000000/download`)
        .expect(400); 
    });

    it("should mark evaluation as FAILED if student API is unreachable", async () => {
      const datasetId = await createTestDatasetForCompetition(db, TEST_COMPETITIONS.COMPETITION_1.id, rawCsvPath);
      createdDatasetId = datasetId;
      // unreachable student API URL because no server is running on this port
      const offlineUrl = "http://localhost:9991/api/predict";
      await createTestSubmissionForUser(db, TEST_COMPETITIONS.COMPETITION_1.id, TEST_USERS.USER_PROJECT_1.id, offlineUrl);

      // start evaluation for the competition
      await request(app)
        .post(`/evaluations/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/start?datasetType=TEST`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // wait a bit for the async evaluation process to complete and mark as FAILED
      await new Promise(r => setTimeout(r, 200));

      const failedEval = await db.get("SELECT * FROM competition_evaluations WHERE datasetId = ?", [datasetId]);
      expect(failedEval.status).toBe("FAILED");
      expect(failedEval.error_message).toBeDefined();
    });

    it("should reject evaluation start if dataset is missing required columns", async () => {
      // CSV without the required columns
      const invalidCsvPath = "/tmp/invalid_dataset.csv";
      fs.writeFileSync(invalidCsvPath, "package_name,version,has_cve\nexpress,1.0,false");
      
      const datasetId = await createTestDatasetForCompetition(db, TEST_COMPETITIONS.COMPETITION_1.id, invalidCsvPath);
      createdDatasetId = datasetId;
      await createTestSubmissionForUser(db, TEST_COMPETITIONS.COMPETITION_1.id, TEST_USERS.USER_PROJECT_1.id, MOCK_STUDENT_API_URL);

      const res = await request(app)
        .post(`/evaluations/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}/start?datasetType=TEST`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(500); // csv validation error should trigger a 500 error response

      expect(res.body.message || res.text).toContain("Dataset is missing required columns. Missing input columns: lines_of_code.");

      if (fs.existsSync(invalidCsvPath)) fs.unlinkSync(invalidCsvPath);
    });
  });
});