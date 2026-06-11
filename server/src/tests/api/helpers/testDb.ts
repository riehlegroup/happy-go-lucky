import { Database } from 'sqlite';
import { initializeDB } from '../../../databaseInitializer';
import { hashPassword } from '../../../Utils/hash';

/**
 * Creates an in-memory SQLite database for testing
 */
export async function createTestDb(): Promise<Database> {
  return await initializeDB(':memory:', false);
}

/**
 * Seeds the database with test data
 */
export async function seedDatabase(db: Database) {
  // Create admin user
  await db.run(
    `INSERT INTO users (name, email, password, status, userRole) VALUES (?, ?, ?, ?, ?)`,
    ['admin', 'admin@test.com', await hashPassword('Admin123!'), 'confirmed', 'ADMIN']
  );

  // Create regular confirmed user
  await db.run(
    `INSERT INTO users (name, email, password, status, userRole) VALUES (?, ?, ?, ?, ?)`,
    ['testuser', 'test@test.com', await hashPassword('Test123!'), 'confirmed', 'USER']
  );

  // Create unconfirmed user
  await db.run(
    `INSERT INTO users (name, email, password, status, userRole) VALUES (?, ?, ?, ?, ?)`,
    ['unconfirmed', 'unconfirmed@test.com', await hashPassword('Test123!'), 'unconfirmed', 'USER']
  );

  // Create suspended user
  await db.run(
    `INSERT INTO users (name, email, password, status, userRole) VALUES (?, ?, ?, ?, ?)`,
    ['suspended', 'suspended@test.com', await hashPassword('Test123!'), 'suspended', 'USER']
  );

  // Create removed user
  await db.run(
    `INSERT INTO users (name, email, password, status, userRole) VALUES (?, ?, ?, ?, ?)`,
    ['removed', 'removed@test.com', await hashPassword('Test123!'), 'removed', 'USER']
  );

  // Create test term
  await db.run(
    `INSERT INTO terms (termName, displayName) VALUES (?, ?)`,
    ['WS2024', 'Winter 2024/25']
  );

  // Create test course
  await db.run(
    `INSERT INTO courses (courseName, termId, studentsCanCreateProject) VALUES (?, ?, ?)`,
    ['Test Course', 1, true]
  );

  // Create test project
  await db.run(
    `INSERT INTO projects (projectName, courseId) VALUES (?, ?)`,
    ['Test Project', 1]
  );

  // Associate user with project
  await db.run(
    `INSERT INTO user_projects (userId, projectId, role) VALUES (?, ?, ?)`,
    [2, 1, 'Developer']
  );

  // Create schedule for course
  const now = Date.now();
  await db.run(
    `INSERT INTO schedules (id, startDate, endDate) VALUES (?, ?, ?)`,
    [1, Math.floor(now / 1000), Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000)]
  );

  // Create submission date
  await db.run(
    `INSERT INTO submissions (id, scheduleId, submissionDate) VALUES (?, ?, ?)`,
    [1, 1, Math.floor((now + 7 * 24 * 60 * 60 * 1000) / 1000)]
  );

  return db;
}

/**
 * Creates a minimal database with just the admin user
 */
export async function createMinimalDb(): Promise<Database> {
  const db = await createTestDb();
  await db.run(
    `INSERT INTO users (name, email, password, status, userRole) VALUES (?, ?, ?, ?, ?)`,
    ['admin', 'admin@test.com', await hashPassword('Admin123!'), 'confirmed', 'ADMIN']
  );
  return db;
}

/**
 * Gets a user by email
 */
export async function getUserByEmail(db: Database, email: string) {
  return await db.get('SELECT * FROM users WHERE email = ?', [email]);
}

/**
 * Gets a course by name
 */
export async function getCourseByName(db: Database, courseName: string) {
  return await db.get('SELECT * FROM courses WHERE courseName = ?', [courseName]);
}

/**
 * Gets a project by name
 */
export async function getProjectByName(db: Database, projectName: string) {
  return await db.get('SELECT * FROM projects WHERE projectName = ?', [projectName]);
}

/**
 * Gets a term by name
 */
export async function getTermByName(db: Database, termName: string) {
  return await db.get('SELECT * FROM terms WHERE termName = ?', [termName]);
}
