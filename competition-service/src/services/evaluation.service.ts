import { BadRequestException } from "../errors/badrequest.error";
import { CompetitionRepo } from "../repositories/competition.repository";
import { DatasetRepo } from "../repositories/dataset.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import { Competition, DatasetType, Evaluation, EvaluationStatus, UpdateEvaluationDto } from "../types/competition.types";
import fs from "fs";
import fastCsv from "fast-csv";

import { EvaluationRepo } from "../repositories/evaluation.repository";
import { NotFoundException } from "../errors/notfound.error";

export class EvaluationService {
	private datasetRepo: DatasetRepo;
	private submissionRepo: SubmissionRepo;
	private evaluationRepo: EvaluationRepo;

	constructor(
		datasetRepo: DatasetRepo,
		submissionRepo: SubmissionRepo,
		competitionRepo: CompetitionRepo,
		evaluationRepo: EvaluationRepo,
	) {
		this.datasetRepo = datasetRepo;
		this.submissionRepo = submissionRepo;
		this.evaluationRepo = evaluationRepo;
	}

	async startEvaluation(competition: Competition, round: number) {
		// check if the current date is within the competition's start and end dates
		const now = new Date();
		if (now < competition.startDate || now > competition.endDate) {
			throw new BadRequestException("Competition is not currently active");
		}

		// check if competition round has already been evaluated by checking if there are any evaluation records for the given competition and round
		const existingEvaluations = await this.evaluationRepo.getEvaluationsByCompetitionAndRound(competition.id, round);
		if (existingEvaluations.length > 0) {
			throw new BadRequestException(
				`Evaluation for competition ID ${competition.id} and round ${round} has already been started`,
			);
		}

		const datasets = await this.datasetRepo.getDatasetsForCompetitionRound(competition.id, round);
		if (datasets.length != 2) {
			throw new Error(
				`Found ${datasets.length} datasets for competition ID ${competition.id} and round ${round}. Expected exactly 2 datasets (input and ground truth).`,
			);
		}
		const inputDataset = datasets.find((d) => d.dataset_type === DatasetType.INPUT);

		if (!inputDataset) {
			throw new Error(`No input dataset found for competition ID ${competition.id} and round ${round}`);
		}

		// call asynchrounously the requests to student apis
		console.log(`Starting evaluation for competition ID and round: ${competition.id}`);
		this.callSubmissionApis(competition.id, round);

		//TODO: Timer to start background job to check for delayed evaluations and mark them as failed after a certain time limit. And maybe delete prepared datasets?
	}

	async requireEvaluationEntryExists(
		token: string,
		expectedStatus: EvaluationStatus,
	): Promise<Evaluation & { competitionId: number }> {
		const evaluation = await this.evaluationRepo.getEvaluationWithCompetitionByToken(token);
		if (!evaluation) {
			throw new BadRequestException("No evaluation entry found for the provided token");
		}
		if (evaluation.status !== expectedStatus) {
			throw new BadRequestException("Evaluation entry is not in the expected status");
		}
		return evaluation;
	}

	async updateEvaluation(evaluationId: number, updateDto: UpdateEvaluationDto): Promise<boolean> {
		return this.evaluationRepo.updateEvaluationStatus(evaluationId, updateDto);
	}

	async getInputDatasetFilePathForCompetiitionAndRound(competitionId: number, round: number): Promise<string> {
		return this.datasetRepo.getDatasetForCompetitionRoundAndType(competitionId, round, DatasetType.INPUT).then((dataset) => {
			if (!dataset) {
				throw new NotFoundException(`No input dataset found for competition ID ${competitionId} and round ${round}`);
			}
			return dataset.file_path;
		});
	}

	async evaluateStudentPrediction(
		competitionId: number,
		evaluation: Evaluation,
		csvString: string,
		receivedAt: number,
	): Promise<number> {
		// Get Ground Truth Dataset for the competition and round
		const roundDatasets = await this.datasetRepo.getDatasetsForCompetitionRound(competitionId, evaluation.round);
		const groundTruthDataset = roundDatasets.find((d) => d.dataset_type === DatasetType.GROUND_TRUTH);
		const inputDataset = roundDatasets.find((d) => d.dataset_type === DatasetType.INPUT);
		if (!groundTruthDataset || !inputDataset) {
			await this.updateEvaluation(evaluation.id, {
				status: EvaluationStatus.FAILED,
				error_message: `No ground truth or input dataset found for competition ID ${competitionId} and round ${evaluation.round}`,
				completed_at: new Date(receivedAt),
			});
			throw new NotFoundException(
				`No ground truth or input dataset found for competition ID ${competitionId} and round ${evaluation.round}`,
			);
		}
		try {
			const [groundTruthCsv, inputCsv] = await Promise.all([
				fs.promises.readFile(groundTruthDataset.file_path, "utf-8"),
				fs.promises.readFile(inputDataset.file_path, "utf-8"),
			]);
			const score = await this.calculateScore(groundTruthCsv, csvString, inputCsv);
			const inferenceTimeMs = receivedAt - new Date(evaluation.started_at).getTime();
			const updateSuccess = await this.updateEvaluation(evaluation.id, {
				status: EvaluationStatus.EVALUATED,
				score: score,
				completed_at: new Date(receivedAt),
				inference_time_ms: inferenceTimeMs,
			});
			if (!updateSuccess) {
				throw new Error("Failed to update evaluation");
			}
			return score;
		} catch (error) {
			console.error(`Error calculating score: ${error}`);
			await this.updateEvaluation(evaluation.id, {
				status: EvaluationStatus.FAILED,
				error_message: `Error calculating score: ${error instanceof Error ? error.message : String(error)}`,
				completed_at: new Date(receivedAt),
			});
			throw new Error(`Error calculating score`);
		}
	}

	private async calculateScore(groundTruthCsv: string, studentPredictionCsv: string, inputCsv: string): Promise<number> {
		// assumes that both CSVs have the same number of rows and columns, and that they are aligned (i.e., the first row of the ground truth corresponds to the first row of the student's prediction, etc.)
		const parseCsv = async (csvString: string): Promise<string[][]> => {
			const rows: string[][] = [];
			await new Promise<void>((resolve, reject) => {
				fastCsv
					.parseString(csvString, { headers: false })
					.on("error", (error) => reject(error))
					.on("data", (row) => rows.push(row))
					.on("end", () => resolve());
			});
			return rows;
		};
		const [groundTruthRows, studentPredictionRows, inputRows] = await Promise.all([
			parseCsv(groundTruthCsv),
			parseCsv(studentPredictionCsv),
			parseCsv(inputCsv),
		]);
		if (groundTruthRows.length !== studentPredictionRows.length || groundTruthRows.length !== inputRows.length) {
			throw new Error(
				`Row count mismatch: Ground truth has ${groundTruthRows.length} rows, student prediction has ${studentPredictionRows.length} rows, and input has ${inputRows.length} rows.`,
			);
		}
		let sumSquaredErrors = 0;
		let targetCount = 0;
		for (let i = 0; i < groundTruthRows.length; i++) {
			const groundTruthRow = groundTruthRows[i];
			const studentPredictionRow = studentPredictionRows[i];
			const inputRow = inputRows[i];
			if (groundTruthRow.length !== studentPredictionRow.length || groundTruthRow.length !== inputRow.length) {
				throw new Error(
					`Column count mismatch in row ${i}: Ground truth has ${groundTruthRow.length} columns, student prediction has ${studentPredictionRow.length} columns, and input has ${inputRow.length} columns.`,
				);
			}
			for (let j = 0; j < groundTruthRow.length; j++) {
				const inVal = inputRow[j] ? inputRow[j].trim() : "";
				// Only calculate score for columns where the input dataset has an empty value
				const isTargetColumn = inVal === "" || inVal === null || inVal === undefined;

				if (isTargetColumn) {
					const groundTruthValue = this.toNumbericValue(groundTruthRow[j]);
					const studentPredictionValue = this.toNumbericValue(studentPredictionRow[j]);
					sumSquaredErrors += Math.pow(groundTruthValue - studentPredictionValue, 2);
					targetCount++;
				}
			}
		}
		return Math.sqrt(sumSquaredErrors / targetCount); // Root Mean Squared Error (RMSE)
	}

	private async callSubmissionApis(competitionId: number, round: number) {
		const submissions = await this.submissionRepo.getAllSubmissionsByCompetition(competitionId);
		if (!submissions || submissions.length === 0) {
			console.warn(`No submissions found for competition ID: ${competitionId}`);
			return;
		}
		// create evaluation entry for each submission before calling the student API
		const preparedEvaluations = submissions.map((submission) => ({
			submissionId: submission.id,
			apiUrl: submission.apiUrl,
			token: crypto.randomUUID(),
			round: round,
		}));

		const createdEvaluations = await Promise.all(
			preparedEvaluations.map(async (evalData) => {
				const evaluation = await this.evaluationRepo.createEvaluation(
					evalData.submissionId,
					evalData.token,
					evalData.round,
				);
				if (!evaluation) {
					console.error(`Failed to create evaluation for submission ID: ${evalData.submissionId}`);
					return null;
				}
				return {
					id: evaluation.id,
					apiUrl: evalData.apiUrl,
					submissionId: evaluation.submissionId,
					token: evalData.token,
				};
			}),
		);

		for (const evaluation of createdEvaluations) {
			if (!evaluation) {
				continue;
			}
			// Call the student's API asynchronously (no await)
			this.callStudentApi(evaluation.id, evaluation.apiUrl, evaluation.token);
		}
	}

	private async callStudentApi(evaluationId: number, apiUrl: string, evaluationToken: string) {
		const clientUrl = process.env.CLIENT_URL || "http://localhost"; //TODO: is client url the right env.variable? is it accessible for the students or must this be caddy url??
		const testDataDownloadEndpoint = `${clientUrl}/api/competition/evaluations/${evaluationToken}/download`;
		const predictionUploadEndpoint = `${clientUrl}/api/competition/evaluations/${evaluationToken}/upload`;

		const body = {
			TestDataDownloadEndpoint: testDataDownloadEndpoint,
			PredictionUploadEndpoint: predictionUploadEndpoint,
		};
		try {
			const response = await fetch(`${apiUrl}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(10000), // 10 seconds timeout
			});

			if (!response.ok) {
				throw new Error(`Student submission API call failed with status ${response.status}`);
			}
		} catch (error: any) {
			const errorMessage =
				error.name === "TimeoutError"
					? "Student submission API did not respond within 10 seconds"
					: error instanceof Error
						? error.message
						: String(error);
			console.error(`Evaluation ${evaluationId} Student API call failed: ${errorMessage}`);
			try {
				const updateDto: UpdateEvaluationDto = {
					status: EvaluationStatus.FAILED,
					error_message: errorMessage,
					completed_at: new Date(),
				};
				await this.evaluationRepo.updateEvaluationStatus(evaluationId, updateDto);
			} catch (error) {
				console.error(`Failed to update evaluation status to FAILED for ${evaluationId}: ${error}`);
			}
		}
	}

	private toNumbericValue(value: unknown): number {
		if (value === null || value === undefined || value === "") {
			return 0; // TODO : Decide how to handle null/undefined/empty string values. For now, returning 0.
		}
		switch (typeof value) {
			case "number":
				return value;
			case "boolean":
				return value ? 1 : 0;
			case "string":
				const str = String(value).trim();
				// handle boolean strings
				if (str.toLowerCase() === "true") return 1;
				if (str.toLowerCase() === "false") return 0;

				// check if the string can be converted to a number (float or integer)
				const num = Number(str);
				if (!isNaN(num) && isFinite(num)) {
					return num;
				}
				// deterministic hashing for non-numeric strings to convert them to a number (djb2 hash function)
				let hash = 5381;
				for (let i = 0; i < str.length; i++) {
					const char = str.charCodeAt(i);
					hash = (hash << 5) + hash + char;
					hash |= 0; // Convert to 32bit integer
				}
				return Math.abs(hash);
			default:
				break;
		}
		throw new Error(`Cannot convert ${value} to a number`);
	}
}
