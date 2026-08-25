import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

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
    courseId: 1
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
    CREATE TABLE IF NOT EXISTS competition_datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitionId INTEGER NOT NULL,
      dataset_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      FOREIGN KEY (competitionId) REFERENCES competitions(id)
    )
  `);
   
  return db;
}

export async function resetTestDatabase(db: Database): Promise<void> {
    await db.exec(`
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
      (2, 'Test Project 2', 1)
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
      (1,'Test Competition 1', 'Description for Competition 1', strftime('%s','now'), strftime('%s','now','+7 days'), 1)
    `);
    await db.run(`
      INSERT INTO competitions (id, name, description, start_date, end_date, courseId) VALUES
      (2, 'Test Competition 2', 'Description for Competition 2', strftime('%s','now'), strftime('%s','now','+7 days'), 2)
    `);
}