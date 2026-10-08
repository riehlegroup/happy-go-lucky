import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

// Testdata constants to be used in the tests

export const TEST_USERS = {
  ADMIN: {
   id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    password: '...',
    status: 'confirmed',
    userRole: 'ADMIN'},
  USER_PROJECT_1: {
    id: 2,
    name: 'Regular User Project 1',
    email: 'user1@example.com',
    password: '...',
    status: 'confirmed',
    userRole: 'USER'},
  USER_PROJECT_2: {
    id: 3,
    name: 'Regular User Project 2',
    email: 'user2@example.com',
    password: '...',
    status: 'confirmed',
    userRole: 'USER'}

} as const;
export const TEST_COURSES = {
  COURSE_1: {
    id: 1,
    courseName: 'Test Course 1',
    termId: 1
  },
  COURSE_2: {
    id: 2,
    courseName: 'Test Course 2',
    termId: 1
  }
} as const;

export const TEST_PROJECTS = {
  PROJECT_1: {
    id: 1,
    projectName: 'Test Project 1',
    courseId: 1
  },
  PROJECT_2: {
    id: 2,
    projectName: 'Test Project 2',
    courseId: 2
  }
} as const;

export const TEST_COMPETITIONS = {
  COMPETITION_1: {
    id: 1,
    name: 'Test Competition 1',
    description: 'Description for Competition 1',
    courseId: 1
  },
  COMPETITION_2: {
    id: 2,
    name: 'Test Competition 2',
    description: 'Description for Competition 2',
    courseId: 2
  }
} as const;

export async function createTestDatabase(): Promise<Database> {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      githubUsername TEXT,
      email TEXT UNIQUE,
      status TEXT DEFAULT "unconfirmed" NOT NULL,
      password TEXT,
      resetPasswordToken TEXT,
      resetPasswordExpire INTEGER,
      confirmEmailToken TEXT,
      confirmEmailExpire INTEGER,
      userRole TEXT DEFAULT "USER" NOT NULL
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      termName TEXT UNIQUE,
      displayName TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseName TEXT UNIQUE,
      termId INTEGER NOT NULL,
      FOREIGN KEY (termId) REFERENCES terms(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectName TEXT UNIQUE,
      courseId INTEGER,
      FOREIGN KEY (courseId) REFERENCES courses(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_projects (
      userId INTEGER,
      projectId INTEGER,
      role TEXT,
      url TEXT,
      PRIMARY KEY (userId, projectId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (projectId) REFERENCES projects(id)
    )
    `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      courseId INTEGER NOT NULL,
      FOREIGN KEY (courseId) REFERENCES courses(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS competition_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitionId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      apiUrl TEXT NOT NULL,
      pseudonym TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitionId) REFERENCES competitions(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE (competitionId, userId),
      UNIQUE (competitionId, pseudonym)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS competition_datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitionId INTEGER NOT NULL,
      round INTEGER,
      dataset_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      FOREIGN KEY (competitionId) REFERENCES competitions(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS competition_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submissionId INTEGER NOT NULL,
      round INTEGER NOT NULL,
      token TEXT,
      score REAL,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      completed_at TEXT,
      inference_time_ms INTEGER,
      status TEXT NOT NULL DEFAULT 'PENDING',
      FOREIGN KEY (submissionId) REFERENCES competition_submissions(id)
    )
  `);

   
  return db;
}

export async function resetTestDatabase(db: Database): Promise<void> {
    await db.exec(`
    DELETE FROM competition_evaluations;
    DELETE FROM competition_datasets;
    DELETE FROM competition_submissions;
    DELETE FROM competitions;
    DELETE FROM user_projects;
    DELETE FROM projects;
    DELETE FROM courses;
    DELETE FROM terms;
    DELETE FROM users;
  `);

  await generateTestData(db);
}

export async function generateTestData(db: Database): Promise<void> {
    // Insert test users
    await db.run(`
      INSERT INTO users (id, name, email, password, status, userRole) VALUES
      (1, 'Admin User', 'admin@example.com', '...', 'confirmed', 'ADMIN')
    `);
    await db.run(`
      INSERT INTO users (id, name, email, password, status, userRole) VALUES
      (2, 'Regular User Project 1', 'user1@example.com', '...', 'confirmed', 'USER')
    `);
    await db.run(`
      INSERT INTO users (id, name, email, password, status, userRole) VALUES
      (3, 'Regular User Project 2', 'user2@example.com', '...', 'confirmed', 'USER')
    `);
    // Insert test terms
    await db.run(`
      INSERT INTO terms (id, termName, displayName) VALUES
      (1, 'term1', 'Term 1')
    `);

    // Test courses
    await db.run(`
      INSERT INTO courses (id, courseName, termId) VALUES
      (1, 'Test Course 1', 1)
    `);
    await db.run(`
      INSERT INTO courses (id, courseName, termId) VALUES
      (2, 'Test Course 2', 1)
    `);

    // Test projects
    await db.run(`
      INSERT INTO projects (id, projectName, courseId) VALUES
      (1, 'Test Project 1', 1)
    `);
    await db.run(`
      INSERT INTO projects (id, projectName, courseId) VALUES
      (2, 'Test Project 2', 2)
    `);

    // Test user_projects
    await db.run(`
      INSERT INTO user_projects (userId, projectId, role, url) VALUES
      (2, 1, 'MEMBER', '  http://example.com/project1')
    `);
    await db.run(`
      INSERT INTO user_projects (userId, projectId, role, url) VALUES
      (3, 2, 'MEMBER', 'http://example.com/project2')
    `);

    // Test competitions
    await db.run(`
      INSERT INTO competitions (id, name, description, start_date, end_date, courseId) VALUES
      (1,'Test Competition 1', 'Description for Competition 1', date('now', '-7 days'), date('now','+7 days'), 1)
    `);
    await db.run(`
      INSERT INTO competitions (id, name, description, start_date, end_date, courseId) VALUES
      (2, 'Test Competition 2', 'Description for Competition 2', date('now', '-7 days'), date('now','+7 days'), 2)
    `);
}

export async function createTestSubmissionForUser(db: Database, competitionId: number, userId: number, apiUrl: string, pseudonym: string): Promise<number> {
    const result = await db.get(`
      INSERT INTO competition_submissions (competitionId, userId, apiUrl, pseudonym) VALUES
      (?, ?, ?, ?) RETURNING id
    `, [competitionId, userId, apiUrl, pseudonym]);
    return result.id;
}
/**
 * Creates test datasets for a specific competition round. creates both ground truth and input datasets and inserts their metadata into the database.
 * @param db The database connection.
 * @param competitionId The ID of the competition.
 * @param round The round number.
 * @param basePath The base path where the datasets will be stored.
 * @param fileName The name of the dataset file.
 */
export async function createDatasetsForCompetitionRound(db: Database, competitionId: number, round: number,  basePath: string): Promise<{inputDatasetId: number, groundTruthDatasetId: number}> {
  const groundTruthDataset = [
		"package_name,version,lines_of_code,has_cve",
		"express,4.18.2,1500,false",
		"lodash,4.17.21,8000,true",
	].join("\n");
  const inputDataset = [
    "package_name,version,lines_of_code,has_cve",
    "express,4.18.2,1500,",
    "lodash,4.17.21,8000,",
  ].join("\n");

  const roundPath = path.join(basePath, `competition_${competitionId}`, `round_${round}`,);
  if (!fs.existsSync(roundPath)) {
    fs.mkdirSync(roundPath, { recursive: true });
  }

  const groundTruthFilePath = path.join(roundPath, `ground_truth_round_${round}.csv`);
  const inputFilePath = path.join(roundPath, `input_round_${round}.csv`);

  fs.writeFileSync(groundTruthFilePath, groundTruthDataset);
  fs.writeFileSync(inputFilePath, inputDataset);

  await db.run(`
    INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name) VALUES
    (?, ?, 'GROUND_TRUTH', ?, ?)
  `, [competitionId, round, groundTruthFilePath, `ground_truth_round_${round}.csv`]);
  const groundTruthDatasetId = await db.get("SELECT last_insert_rowid() as id");
  
  await db.run(`
    INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name) VALUES
    (?, ?, 'INPUT', ?, ?)
  `, [competitionId, round, inputFilePath, `input_round_${round}.csv`]);
  const inputDatasetId = await db.get("SELECT last_insert_rowid() as id");

  return { inputDatasetId: inputDatasetId.id, groundTruthDatasetId: groundTruthDatasetId.id };
}