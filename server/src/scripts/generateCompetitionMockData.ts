import type { Database } from "sqlite";
import fs from "fs";
import path from "path";
import { initializeDB } from "../databaseInitializer";
import { hashPassword } from "../Utils/hash";

const PSEUDONYMS = [
  "GradientNinja", "RandomForestFox", "LossMinimizer", "EpochExplorer",
  "HyperTuneHero", "XGBooster", "TensorTitan", "FeatureWizard",
  "BiasBuster", "VectorVanguard", "BackpropBeast", "DataDragon",
  "BatchNormalizer", "DropOutKing", "LatentLover", "SoftmaxSamurai",
  "AdamOptimizer", "RocAucRuler", "PrecisionPilot", "RecallRanger",
  "SigmoidSurfer", "KernelKnight", "ClusterCaptain", "DeepLearner42",
  "MatrixMaverick", "EigenvectorElf", "PValuePirate", "SupervisedSam"
];

// Sample CSV payloads for mock datasets
const DUMMY_TRAIN_CSV = [
  "id,package_name,version,lines_of_code,cyclomatic_complexity,has_vulnerability",
  "1,express,4.18.2,1500,12,0",
  "2,lodash,4.17.21,8000,45,1",
  "3,axios,1.6.0,3200,18,0",
  "4,react,18.2.0,12000,52,0",
  "5,jsonwebtoken,9.0.2,950,8,1"
].join("\n");

const DUMMY_INPUT_CSV = [
  "id,package_name,version,lines_of_code,cyclomatic_complexity",
  "101,fastify,4.24.0,2100,14",
  "102,moment,2.29.4,4500,38",
  "103,commander,11.1.0,950,7",
  "104,winston,3.11.0,3800,22"
].join("\n");

const DUMMY_GROUND_TRUTH_CSV = [
  "id,has_vulnerability",
  "101,0",
  "102,1",
  "103,0",
  "104,0"
].join("\n");

/**
 * Traverses up the directory tree starting from startDir
 * until it finds the root directory containing 'competition-service'.
 */
function findProjectRoot(startDir: string = __dirname): string {
  let current = path.resolve(startDir);
  const root = path.parse(current).root;

  while (current !== root) {
    if (fs.existsSync(path.join(current, "competition-service"))) {
      return current;
    }
    current = path.dirname(current);
  }

  // Fallback to process.cwd() if not found in parent hierarchy
  return process.cwd();
}

async function generateCompetitionMockData(db: Database) {
  try {
    console.log("Starting competition mock data generation...\n");

    // 1. Resolve target course and project
    const course = await db.get<{ id: number }>(
      `SELECT id FROM courses WHERE courseName = 'AMOS Course Mock'`
    );
    if (!course) {
      throw new Error("Course 'AMOS Course Mock' not found. Please run 'generateMockData.ts' first.");
    }

    const project = await db.get<{ id: number }>(
      `SELECT id FROM projects WHERE projectName = 'AMOS – Smart Campus App'`
    );
    if (!project) {
      throw new Error("Project 'AMOS – Smart Campus App' not found.");
    }

    // 2. Clean up previously generated competition mock data
    const compName = "Code Vulnerability Detection 2026";
    const existingComp = await db.get<{ id: number }>(
      `SELECT id FROM competitions WHERE name = ?`,
      [compName]
    );

    if (existingComp) {
      console.log(`Cleaning up existing mock competition (ID: ${existingComp.id})...`);
      await db.run(
        `DELETE FROM competition_evaluations WHERE submissionId IN (
          SELECT id FROM competition_submissions WHERE competitionId = ?
        )`,
        [existingComp.id]
      );
      await db.run(`DELETE FROM competition_submissions WHERE competitionId = ?`, [existingComp.id]);
      await db.run(`DELETE FROM competition_datasets WHERE competitionId = ?`, [existingComp.id]);
      await db.run(`DELETE FROM competitions WHERE id = ?`, [existingComp.id]);
    }

    // Clean up existing competition mock student users
    await db.run(`DELETE FROM user_projects WHERE userId IN (
      SELECT id FROM users WHERE email LIKE 'student_comp_%@fau.de'
    )`);
    await db.run(`DELETE FROM users WHERE email LIKE 'student_comp_%@fau.de'`);

    // 3. Create competition
    console.log("Creating competition record...");
    const compResult = await db.run(
      `INSERT INTO competitions (name, description, start_date, end_date, courseId)
       VALUES (?, ?, ?, ?, ?)`,
      [
        compName,
        "Predict software vulnerabilities (CVEs) in open-source libraries based on static code metrics.",
        "2026-10-01",
        "2026-12-31",
        course.id
      ]
    );
    const competitionId = compResult.lastID!;
    console.log(`  ✓ Competition '${compName}' created with ID: ${competitionId}\n`);

    // 4. Resolve folder structure using dynamic project root
    const rootDir = findProjectRoot();
    const uploadsBase = path.join(
      rootDir,
      "competition-service",
      "uploads",
      "datasets",
      `competition_${competitionId}`
    );

    const round1Dir = path.join(uploadsBase, "round_1");
    const round2Dir = path.join(uploadsBase, "round_2");

    fs.mkdirSync(uploadsBase, { recursive: true });
    fs.mkdirSync(round1Dir, { recursive: true });
    fs.mkdirSync(round2Dir, { recursive: true });

    console.log("Creating physical dataset files and DB references...");
    console.log(`  Destination directory: ${uploadsBase}`);

    // A) Training dataset
    const trainFilePath = path.join(uploadsBase, "train_dataset.csv");
    fs.writeFileSync(trainFilePath, DUMMY_TRAIN_CSV);
    await db.run(
      `INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name)
       VALUES (?, NULL, 'TRAIN', ?, 'train_dataset.csv')`,
      [competitionId, trainFilePath]
    );

    // B) Round 1 datasets (INPUT & GROUND_TRUTH)
    const r1InputPath = path.join(round1Dir, "round_1_input.csv");
    const r1GtPath = path.join(round1Dir, "round_1_ground_truth.csv");
    fs.writeFileSync(r1InputPath, DUMMY_INPUT_CSV);
    fs.writeFileSync(r1GtPath, DUMMY_GROUND_TRUTH_CSV);

    await db.run(
      `INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name)
       VALUES (?, 1, 'INPUT', ?, 'round_1_input.csv')`,
      [competitionId, r1InputPath]
    );
    await db.run(
      `INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name)
       VALUES (?, 1, 'GROUND_TRUTH', ?, 'round_1_ground_truth.csv')`,
      [competitionId, r1GtPath]
    );

    // C) Round 2 datasets (INPUT & GROUND_TRUTH)
    const r2InputPath = path.join(round2Dir, "round_2_input.csv");
    const r2GtPath = path.join(round2Dir, "round_2_ground_truth.csv");
    fs.writeFileSync(r2InputPath, DUMMY_INPUT_CSV);
    fs.writeFileSync(r2GtPath, DUMMY_GROUND_TRUTH_CSV);

    await db.run(
      `INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name)
       VALUES (?, 2, 'INPUT', ?, 'round_2_input.csv')`,
      [competitionId, r2InputPath]
    );
    await db.run(
      `INSERT INTO competition_datasets (competitionId, round, dataset_type, file_path, file_name)
       VALUES (?, 2, 'GROUND_TRUTH', ?, 'round_2_ground_truth.csv')`,
      [competitionId, r2GtPath]
    );
    console.log("  ✓ Datasets created for Training, Round 1, and Round 2\n");

    // 5. Generate student accounts, submissions, and evaluations
    console.log(`Generating ${PSEUDONYMS.length} students, submissions, and evaluations...`);
    const studentPassword = await hashPassword("student-password");
    const rounds = [1, 2];

    for (let i = 0; i < PSEUDONYMS.length; i++) {
      const pseudonym = PSEUDONYMS[i];
      const email = `student_comp_${i + 1}@fau.de`;

      // Create user
      const userRes = await db.run(
        `INSERT INTO users (name, githubUsername, email, password, status, userRole)
         VALUES (?, ?, ?, ?, 'confirmed', 'USER')`,
        [`Student ${pseudonym}`, `gh_${pseudonym.toLowerCase()}`, email, studentPassword]
      );
      const userId = userRes.lastID!;

      // Assign student to course project
      await db.run(
        `INSERT INTO user_projects (userId, projectId, role, url)
         VALUES (?, ?, 'Developer', ?)`,
        [userId, project.id, `https://github.com/fau/${pseudonym.toLowerCase()}`]
      );

      // Create competition submission
      const subRes = await db.run(
        `INSERT INTO competition_submissions (competitionId, userId, apiUrl, pseudonym)
         VALUES (?, ?, ?, ?)`,
        [
          competitionId,
          userId,
          `https://${pseudonym.toLowerCase()}.deta.app/predict`,
          pseudonym
        ]
      );
      const submissionId = subRes.lastID!;

      // 6. Generate evaluations for Rounds 1 and 2
      for (const round of rounds) {
        // Base score tiering for varied ranking positions
        const baseScore = 0.11 + i * 0.038 + (round === 2 ? 0.015 : 0);
        const score = Number((baseScore + Math.random() * 0.03).toFixed(4));
        const inferenceTime = Math.floor(45 + Math.random() * 190 + i * 6);
        const completedAt = new Date(Date.now() - (3 - round) * 86400000).toISOString();

        await db.run(
          `INSERT INTO competition_evaluations 
           (submissionId, round, token, score, inference_time_ms, status, created_at, started_at, completed_at)
           VALUES (?, ?, ?, ?, ?, 'EVALUATED', ?, ?, ?)`,
          [
            submissionId,
            round,
            `token_seed_${submissionId}_r${round}`,
            score,
            inferenceTime,
            completedAt,
            completedAt,
            completedAt
          ]
        );
      }
    }

    console.log(`  ✓ Created ${PSEUDONYMS.length} participants with active submissions`);
    console.log(`  ✓ Generated ${PSEUDONYMS.length * rounds.length} completed evaluations (Status: EVALUATED)\n`);

    console.log("=".repeat(60));
    console.log("Competition mock data generated successfully!");
    console.log("=".repeat(60));
    console.log(`Competition ID:  ${competitionId}`);
    console.log(`Associated Course: ${course.id} (AMOS Course Mock)`);
    console.log(`Active Rounds:   Round 1, Round 2`);


  } catch (error) {
    console.error("Failed to generate competition mock data:", error);
    throw error;
  }
}

// Execution harness
const args = process.argv.slice(2);
const dbPath = args.find((arg) => !arg.startsWith("--")) || "./server/happyGoLucky.db";

async function run() {
  const db = await initializeDB(dbPath);
  try {
    await generateCompetitionMockData(db);
  } finally {
    await db.close();
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});