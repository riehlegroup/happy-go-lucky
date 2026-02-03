import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { hashPassword } from '../Utils/hash';

/**
 * Generates mock data for development.
 *
 * Creates a semester with students, courses, projects,
 * and happiness ratings for past sprints.
 */
export async function generateMockData(dbPath: string = './server/myDatabase.db', deleteOnly: boolean = false) {
  console.log(`Connecting to database at: ${dbPath}`);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  try {
    console.log('Starting mock data generation...\n');

    console.log('Cleaning up any existing mock data...');
    await db.run(`DELETE FROM happiness WHERE projectId IN (
      SELECT id FROM projects WHERE projectName IN ('AMOS Project 1', 'ADAP Project 1')
    )`);
    await db.run(`DELETE FROM user_projects WHERE projectId IN (
      SELECT id FROM projects WHERE projectName IN ('AMOS Project 1', 'ADAP Project 1')
    )`);
    await db.run(`DELETE FROM submissions WHERE scheduleId IN (
      SELECT id FROM courses WHERE courseName IN ('AMOS Course Mock', 'ADAP Course Mock')
    )`);
    await db.run(`DELETE FROM schedules WHERE id IN (
      SELECT id FROM courses WHERE courseName IN ('AMOS Course Mock', 'ADAP Course Mock')
    )`);
    await db.run(`DELETE FROM projects WHERE projectName IN ('AMOS Project 1', 'ADAP Project 1')`);
    await db.run(`DELETE FROM users WHERE email IN (
      'amos-student-1@fau.de', 'amos-student-2@fau.de', 'adap-student-1@fau.de',
      'tarikul.islam@fau.de', 'ashraf.ullah@fau.de', 'sazid.rahaman@fau.de', 'kawser.hamid@fau.de'
    )`);
    await db.run(`DELETE FROM courses WHERE courseName IN ('AMOS Course Mock', 'ADAP Course Mock')`);
    await db.run(`DELETE FROM terms WHERE termName = 'WS26'`);
    console.log('  ✓ Cleanup complete\n');

    if (deleteOnly) {
      console.log('Delete-only mode: Skipping data generation.');
      return;
    }

    const now = Date.now();
    const threeWeeksAgo = now - (3 * 7 * 24 * 60 * 60 * 1000);
    const fifteenWeeksFromStart = threeWeeksAgo + (15 * 7 * 24 * 60 * 60 * 1000);

    const startDate = Math.floor(threeWeeksAgo / 1000);
    const endDate = Math.floor(fifteenWeeksFromStart / 1000);
    const currentTime = Math.floor(now / 1000);

    console.log('Creating term: WS26');
    const termResult = await db.run(
      `INSERT INTO terms (termName, displayName) VALUES (?, ?)`,
      ['WS26', 'Winter Semester 2026']
    );
    const termId = termResult.lastID;
    console.log(`  ✓ Term created with ID: ${termId}\n`);

    console.log('Creating courses...');
    const amosResult = await db.run(
      `INSERT INTO courses (courseName, termId) VALUES (?, ?)`,
      ['AMOS Course Mock', termId]
    );
    const amosCourseId = amosResult.lastID;
    console.log(`  ✓ AMOS Course Mock created with ID: ${amosCourseId}`);

    const adapResult = await db.run(
      `INSERT INTO courses (courseName, termId) VALUES (?, ?)`,
      ['ADAP Course Mock', termId]
    );
    const adapCourseId = adapResult.lastID;
    console.log(`  ✓ ADAP Course Mock created with ID: ${adapCourseId}\n`);

    console.log('Creating projects...');
    const amosProjectResult = await db.run(
      `INSERT INTO projects (projectName, courseId) VALUES (?, ?)`,
      ['AMOS Project 1', amosCourseId]
    );
    const amosProjectId = amosProjectResult.lastID;
    console.log(`  ✓ AMOS Project 1 created with ID: ${amosProjectId}`);

    const adapProjectResult = await db.run(
      `INSERT INTO projects (projectName, courseId) VALUES (?, ?)`,
      ['ADAP Project 1', adapCourseId]
    );
    const adapProjectId = adapProjectResult.lastID;
    console.log(`  ✓ ADAP Project 1 created with ID: ${adapProjectId}\n`);

    console.log('Creating users...');
    const tarikulIslamPassword = await hashPassword('tarikul-islam-password');
    const tarikulIslamResult = await db.run(
      `INSERT INTO users (name, githubUsername, email, password, status, userRole) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Tarikul Islam', 'tarikul-amos', 'tarikul.islam@fau.de', tarikulIslamPassword, 'confirmed', 'USER']
    );
    const tarikulIslamId = tarikulIslamResult.lastID!;
    console.log(`  ✓ Tarikul Islam (tarikul.islam@fau.de) created with ID: ${tarikulIslamId}`);

    const ashrafUllahPassword = await hashPassword('ashraf-ullah-password');
    const ashrafUllahResult = await db.run(
      `INSERT INTO users (name, githubUsername, email, password, status, userRole) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Ashraf Ullah', 'ashraf-amosso', 'ashraf.ullah@fau.de', ashrafUllahPassword, 'confirmed', 'USER']
    );
    const ashrafUllahId = ashrafUllahResult.lastID!;
    console.log(`  ✓ Ashraf Ullah (ashraf.ullah@fau.de) created with ID: ${ashrafUllahId}`);

    const sazidRahamanPassword = await hashPassword('sazid-rahaman-password');
    const sazidRahamanResult = await db.run(
      `INSERT INTO users (name, githubUsername, email, password, status, userRole) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Sazid Rahaman', 'sazid-adap', 'sazid.rahaman@fau.de', sazidRahamanPassword, 'confirmed', 'USER']
    );
    const sazidRahamanId = sazidRahamanResult.lastID!;
    console.log(`  ✓ Sazid Rahaman (sazid.rahaman@fau.de) created with ID: ${sazidRahamanId}`);

    const kawserHamidPassword = await hashPassword('kawser-hamid-password');
    const kawserHamidResult = await db.run(
      `INSERT INTO users (name, githubUsername, email, password, status, userRole) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Kawser Hamid', 'kawser-adaptor', 'kawser.hamid@fau.de', kawserHamidPassword, 'confirmed', 'USER']
    );
    const kawserHamidId = kawserHamidResult.lastID!;
    console.log(`  ✓ Kawser Hamid (kawser.hamid@fau.de) created with ID: ${kawserHamidId}\n`);

    console.log('Creating project memberships...');
    const tarikulRepoUrl = 'https://github.com/night-fury-me/digital-alchemy';
    const ashrafRepoUrl = 'https://github.com/night-fury-me/advanced-data-engineering-fau';
    const sazidRepoUrl = 'https://github.com/night-fury-me/real-time-vehicle-data-processing';
    const kawserRepoUrl = 'https://github.com/night-fury-me/happy-go-lucky';

    await db.run(
      `INSERT INTO user_projects (userId, projectId, role, url) VALUES (?, ?, ?, ?)`,
      [tarikulIslamId, amosProjectId, 'Owner', tarikulRepoUrl]
    );
    console.log(`  ✓ Tarikul Islam → AMOS Project 1 (Owner) | Repo: ${tarikulRepoUrl}`);

    await db.run(
      `INSERT INTO user_projects (userId, projectId, role, url) VALUES (?, ?, ?, ?)`,
      [ashrafUllahId, amosProjectId, 'Developer', ashrafRepoUrl]
    );
    console.log(`  ✓ Ashraf Ullah → AMOS Project 1 (Developer) | Repo: ${ashrafRepoUrl}`);

    await db.run(
      `INSERT INTO user_projects (userId, projectId, role, url) VALUES (?, ?, ?, ?)`,
      [sazidRahamanId, adapProjectId, 'Owner', sazidRepoUrl]
    );
    console.log(`  ✓ Sazid Rahaman → ADAP Project 1 (Owner) | Repo: ${sazidRepoUrl}`);

    await db.run(
      `INSERT INTO user_projects (userId, projectId, role, url) VALUES (?, ?, ?, ?)`,
      [kawserHamidId, adapProjectId, 'Developer', kawserRepoUrl]
    );
    console.log(`  ✓ Kawser Hamid → ADAP Project 1 (Developer) | Repo: ${kawserRepoUrl}\n`);

    console.log('Creating course schedules (15 weeks, started 3 weeks ago)...');
    await db.run(
      `INSERT INTO schedules (id, startDate, endDate) VALUES (?, ?, ?)`,
      [amosCourseId, startDate, endDate]
    );
    console.log(`  ✓ AMOS schedule created (ID: ${amosCourseId})`);

    await db.run(
      `INSERT INTO schedules (id, startDate, endDate) VALUES (?, ?, ?)`,
      [adapCourseId, startDate, endDate]
    );
    console.log(`  ✓ ADAP schedule created (ID: ${adapCourseId})\n`);

    console.log('Creating submission dates (15 weeks, every 7 days)...');
    const amosSubmissionIds: number[] = [];
    const adapSubmissionIds: number[] = [];

    for (let week = 1; week <= 15; week++) {
      const submissionTime = threeWeeksAgo + (week * 7 * 24 * 60 * 60 * 1000);
      const submissionDate = Math.floor(submissionTime / 1000);

      const amosSubResult = await db.run(
        `INSERT INTO submissions (scheduleId, submissionDate) VALUES (?, ?)`,
        [amosCourseId, submissionDate]
      );
      amosSubmissionIds.push(amosSubResult.lastID!);

      const adapSubResult = await db.run(
        `INSERT INTO submissions (scheduleId, submissionDate) VALUES (?, ?)`,
        [adapCourseId, submissionDate]
      );
      adapSubmissionIds.push(adapSubResult.lastID!);
    }
    console.log(`  ✓ Created 15 submission dates for AMOS course`);
    console.log(`  ✓ Created 15 submission dates for ADAP course\n`);

    console.log('Creating happiness ratings for past/current sprints...');

    const amosMembers = [
      { id: tarikulIslamId, label: 'Tarikul Islam' },
      { id: ashrafUllahId, label: 'Ashraf Ullah' },
    ];
    const adapMembers = [
      { id: sazidRahamanId, label: 'Sazid Rahaman' },
      { id: kawserHamidId, label: 'Kawser Hamid' },
    ];

    const ratingsCountByUserId = new Map<number, number>();

    for (let i = 0; i < 15; i++) {
      const submissionTime = threeWeeksAgo + ((i + 1) * 7 * 24 * 60 * 60 * 1000);
      const submissionTimestamp = Math.floor(submissionTime / 1000);

      if (submissionTimestamp <= currentTime) {
        for (const member of amosMembers) {
          const happiness = Math.floor(Math.random() * 7) - 3;
          await db.run(
            `INSERT INTO happiness (projectId, userId, happiness, submissionDateId, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [amosProjectId, member.id, happiness, amosSubmissionIds[i], submissionTimestamp]
          );
          ratingsCountByUserId.set(member.id, (ratingsCountByUserId.get(member.id) ?? 0) + 1);
        }

        for (const member of adapMembers) {
          const happiness = Math.floor(Math.random() * 7) - 3;
          await db.run(
            `INSERT INTO happiness (projectId, userId, happiness, submissionDateId, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [adapProjectId, member.id, happiness, adapSubmissionIds[i], submissionTimestamp]
          );
          ratingsCountByUserId.set(member.id, (ratingsCountByUserId.get(member.id) ?? 0) + 1);
        }
      }
    }

    for (const member of [...amosMembers, ...adapMembers]) {
      console.log(`  ✓ Created ${ratingsCountByUserId.get(member.id) ?? 0} happiness ratings for ${member.label}`);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('Mock data generation completed successfully!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log(`  Terms: 1`);
    console.log(`  Courses: 2 (AMOS Course Mock, ADAP Course Mock)`);
    console.log(`  Projects: 2 (AMOS Project 1, ADAP Project 1)`);
    console.log(`  Students: 4`);
    console.log(`  Project memberships: 4`);
    console.log(`  Schedules: 2 (15 weeks each, started 3 weeks ago)`);
    console.log(`  Submission dates: 30 (15 per course)`);
    console.log(`  Happiness ratings: ${Array.from(ratingsCountByUserId.values()).reduce((a, b) => a + b, 0)}`);
    console.log('\nStudent Accounts:');
    console.log('  Email: tarikul.islam@fau.de | Password: tarikul-islam-password | Project: AMOS (Owner)');
    console.log('  Email: ashraf.ullah@fau.de | Password: ashraf-ullah-password | Project: AMOS (Developer)');
    console.log('  Email: sazid.rahaman@fau.de | Password: sazid-rahaman-password | Project: ADAP (Owner)');
    console.log('  Email: kawser.hamid@fau.de | Password: kawser-hamid-password | Project: ADAP (Developer)');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error generating mock data:');
    console.error(error);
    throw error;
  } finally {
    await db.close();
    console.log('\nDatabase connection closed.');
  }
}

export function parseArgs(args: string[]) {
  return {
    deleteOnly: args.includes('--delete-only'),
    dbPath: args.find((arg) => !arg.startsWith('--')) || './server/myDatabase.db',
  };
}

export async function runFromCli(args: string[]) {
  const parsed = parseArgs(args);
  await generateMockData(parsed.dbPath, parsed.deleteOnly);
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runFromCli(process.argv.slice(2))
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
