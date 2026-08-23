import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import { Database } from "sqlite";
import { createCompetitionRouter } from "../../src/routes/competition.routes";
import {
  createTestDatabase,
  resetTestDatabase,
  TEST_COMPETITIONS,
  TEST_USERS,
} from "./helpers/testDb.helper";
import { generateTestToken } from "./helpers/auth.helper";
import { CreateCompetitionDto } from "../../src/types/competition.types";

describe("Competition API Integrationtest", () => {
  let db: Database;
  let app: Express;

  beforeAll(async () => {
    // Initialize the database and application here
    db = await createTestDatabase();
    app = express();
    app.use(express.json());
    app.use("/competitions", createCompetitionRouter(db));
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Reset the database state before each test
    await resetTestDatabase(db);
  });

  // ----- Test cases for the Competition API endpoints will go here -----
  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/competitions");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  it("should return 200 and list of competitions for authenticated user", async () => {
    const token = generateTestToken(TEST_USERS.ADMIN.id);
    const response = await request(app)
      .get("/competitions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: TEST_COMPETITIONS.COMPETITION_1.id,
          name: TEST_COMPETITIONS.COMPETITION_1.name,
          description: TEST_COMPETITIONS.COMPETITION_1.description,
          courseId: TEST_COMPETITIONS.COMPETITION_1.courseId,
        }),
        expect.objectContaining({
          id: TEST_COMPETITIONS.COMPETITION_2.id,
          name: TEST_COMPETITIONS.COMPETITION_2.name,
          description: TEST_COMPETITIONS.COMPETITION_2.description,
          courseId: TEST_COMPETITIONS.COMPETITION_2.courseId,
        }),
      ]),
    );
  });

  it("should return 403 if user is not a member of the course associated with the competition", async () => {
    const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
    const response = await request(app)
      .get(`/competitions/${TEST_COMPETITIONS.COMPETITION_2.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "User is not a member of the course associated with this competition",
    );
  });

  it("should return 200 and competition details for a user who is a member of the course", async () => {
    const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
    const response = await request(app)
      .get(`/competitions/${TEST_COMPETITIONS.COMPETITION_1.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: TEST_COMPETITIONS.COMPETITION_1.id,
        name: TEST_COMPETITIONS.COMPETITION_1.name,
        description: TEST_COMPETITIONS.COMPETITION_1.description,
        courseId: TEST_COMPETITIONS.COMPETITION_1.courseId,
      }),
    );
  });

  it("should return 404 if competition does not exist", async () => {
    const token = generateTestToken(TEST_USERS.ADMIN.id);
    const response = await request(app)
      .get("/competitions/9999") // Assuming 9999 is a non-existent competition ID
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Competition not found");
  });

  it("should return 201 and create a new competition for an admin user", async () => {
    const token = generateTestToken(TEST_USERS.ADMIN.id);
    await db.run(
      `INSERT INTO courses (id, courseName, termId) VALUES (3, 'Test Course 3', 1)`,
    ); // New empty course for the new competition

    const newCompetition: CreateCompetitionDto = {
      name: "New Test Competition",
      description: "Description for New Test Competition",
      start_date: "2026-01-01T00:00:00Z",
      end_date: "2026-01-08T00:00:00Z",
      courseId: 3,
    };

    const response = await request(app)
      .post("/competitions")
      .set("Authorization", `Bearer ${token}`)
      .send(newCompetition);

    console.log("Response body:", response.body); // Log the response body for debugging

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
        expect.objectContaining({
            id: expect.any(Number),
            name: newCompetition.name,
            description: newCompetition.description,
            courseId: newCompetition.courseId,
            start_date: newCompetition.start_date,
            end_date: newCompetition.end_date,
        }),
    );
    let countResult = await db.get(
      `SELECT COUNT(*) as count FROM competitions WHERE name = ?`,
      newCompetition.name,
    );
    expect(countResult.count).toBe(1); // Ensure the competition was actually created in the database
  });

  it("should return 403 if a non-admin user tries to create a competition", async () => {
    const token = generateTestToken(TEST_USERS.USER_PROJECT_1.id);
    const newCompetition: CreateCompetitionDto = {
      name: "Unauthorized Competition",
      description: "This should not be created",
      start_date: "2026-01-01T00:00:00Z",
      end_date: "2026-01-08T00:00:00Z",
      courseId: TEST_COMPETITIONS.COMPETITION_1.courseId,
    };

    const response = await request(app)
      .post("/competitions")
      .set("Authorization", `Bearer ${token}`)
      .send(newCompetition);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("User is not an admin");
  });
});
