import { BadRequestException } from "../errors/badrequest.error";
import { DatasetRepo } from "../repositories/dataset.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import { Competition, DatasetType, Evaluation, EvaluationStatus, UpdateEvaluationDto } from "../types/competition.types";

import { EvaluationRepo } from "../repositories/evaluation.repository";
import { NotFoundException } from "../errors/notfound.error";
import { DatasetRoundCache } from "./datasetround.cache";
import { CSVHelper } from "./helper/csv.helper";

export class EvaluationService {
	private datasetRepo: DatasetRepo;
	private submissionRepo: SubmissionRepo;
	private evaluationRepo: EvaluationRepo;
	private datasetRoundCache: DatasetRoundCache;

	private static readonly DEADLINE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

	constructor(
		datasetRepo: DatasetRepo,
		submissionRepo: SubmissionRepo,
		evaluationRepo: EvaluationRepo,
		datasetRoundCache: DatasetRoundCache,
	) {
		this.datasetRepo = datasetRepo;
		this.submissionRepo = submissionRepo;
		this.evaluationRepo = evaluationRepo;
		this.datasetRoundCache = datasetRoundCache;
	}

	async startEvaluation(competition: Competition, round: number, forceRestart: boolean = false) {
		// check if the current date is within the competition's start and end dates
		const now = new Date().getTime();
		if (now < competition.startDate.getTime() || now > competition.endDate.getTime()) {
			throw new BadRequestException("Competition is not currently active");
		}

		// check if competition round has already been evaluated by checking if there are any evaluation records for the given competition and round
		const existingEvaluations = await this.evaluationRepo.getEvaluationsByCompetitionAndRound(competition.id, round);
		if (existingEvaluations.length > 0) {
			if (!forceRestart) {
				throw new BadRequestException(
					`Evaluation for competition ID ${competition.id} and round ${round} has already been started`,
				);
			}
			await this.evaluationRepo.deleteEvaluationsByCompetitionAndRound(competition.id, round);
			this.datasetRoundCache.clearCacheForCompetitionRound(competition.id, round);
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

		console.log(`[EVALUATION] Starting evaluation for competition ID ${competition.id} and round ${round}`);
		await this.callSubmissionApis(competition.id, round);
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

	async getInputDatasetFilePathForCompetitionAndRound(competitionId: number, round: number): Promise<string> {
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
	): Promise<void> {
		const startMs = new Date(evaluation.started_at).getTime();
		const isDelayed = (receivedAt - startMs) > EvaluationService.DEADLINE_LIMIT_MS;
		const inferenceTimeMs = receivedAt - startMs;
		const status = isDelayed ? EvaluationStatus.DELAYED : EvaluationStatus.EVALUATED;
		console.log(`[EVALUATION] Scoring started for evaluation id ${evaluation.id}.`);
		try {
			// Get Datasets from Cache
			const groundTruthRows = await this.datasetRoundCache.getOrLoadGroundTruthDataset(competitionId, evaluation.round);

			const score = await this.calculateScore(groundTruthRows, csvString);
			const updateSuccess = await this.updateEvaluation(evaluation.id, {
				status: status,
				score: score,
				completed_at: new Date(receivedAt),
				inference_time_ms: inferenceTimeMs,
				error_message: isDelayed
					? "Submission exceeded the deadline and is therefore penalized on the leaderboard."
					: null,
			});
			if (!updateSuccess) {
				throw new Error("Failed to update evaluation");
			}
			console.log(
				`[EVALUATION] Scoring completed for evaluation ${evaluation.id}. Score: ${score}, inference time: ${inferenceTimeMs}ms, status: ${status}`,
			);
		} catch (error) {
			console.error(`[EVALUATION] Error calculating score for evaluation ${evaluation.id}: ${error}`);
			let errorMessage;
			if (error instanceof NotFoundException) {
				errorMessage = `No ground truth dataset found for competition ID ${competitionId} and round ${evaluation.round}`;
			} else if (error instanceof BadRequestException) {
				errorMessage = `Invalid request: ${error.message}`;
			} else {
				errorMessage = `Error calculating score: ${error instanceof Error ? error.message : String(error)}`;
			}
			await this.updateEvaluation(evaluation.id, {
				status: EvaluationStatus.FAILED,
				error_message: errorMessage,
				completed_at: new Date(receivedAt),
			});
		}
	}

	private async calculateScore(groundTruthRows: string[][], studentPredictionCsv: string): Promise<number> {
		const delimiter = CSVHelper.detectStudentPredictionDelimiter(studentPredictionCsv);
		if (delimiter !== ",") {
			throw new BadRequestException("Prediction CSV must use ',' as delimiter.");
		}
		const studentPredictionRows = await CSVHelper.parseCsv(studentPredictionCsv, ",");
		if (groundTruthRows.length !== studentPredictionRows.length) {
			throw new BadRequestException(
				`Row count mismatch: Ground truth has ${groundTruthRows.length} rows, student prediction has ${studentPredictionRows.length} rows.`,
			);
		}

		const gtHeader = groundTruthRows[0];
		const predHeader = studentPredictionRows[0];
		if (gtHeader.length !== predHeader.length) {
			throw new BadRequestException(
				`Column count mismatch in row 0: Ground truth has ${gtHeader.length} columns, student prediction has ${predHeader.length} columns.`,
			);
		}
		for (let j = 0; j < gtHeader.length; j++) {
			if (gtHeader[j].trim() !== predHeader[j].trim()) {
				throw new BadRequestException(
					`Header mismatch in column ${j}: expected '${gtHeader[j].trim()}', received '${predHeader[j].trim()}'.`,
				);
			}
		}

		let sumSquaredErrors = 0;
		for (let i = 1; i < groundTruthRows.length; i++) {
			const groundTruthRow = groundTruthRows[i];
			const studentPredictionRow = studentPredictionRows[i];
			if (groundTruthRow.length !== studentPredictionRow.length) {
				throw new BadRequestException(
					`Column count mismatch in row ${i}: Ground truth has ${groundTruthRow.length} columns, student prediction has ${studentPredictionRow.length} columns.`,
				);
			}
			for (let j = 0; j < groundTruthRow.length; j++) {
				const groundTruthValue = this.convertToNumericValue(groundTruthRow[j]);
				const studentPredictionValue = this.convertToNumericValue(studentPredictionRow[j]);
				sumSquaredErrors += Math.pow(groundTruthValue - studentPredictionValue, 2);
				
			}
		}
		return Math.sqrt(sumSquaredErrors); // Euclidean distance (RSE)
	}

	private async callSubmissionApis(competitionId: number, round: number) {
		const submissions = await this.submissionRepo.getAllSubmissionsByCompetition(competitionId);
		if (!submissions || submissions.length === 0) {
			console.warn(`[EVALUATION] No submissions found for competition ID: ${competitionId}`);
			return;
		}
		// to avoid too many open connections, we batch the calls to student APIs. Evaluation records are created first for every batch and then the student APIs are called asynchronously.
		// that way neither the database, the number of open connections nor the upload prediction endpoint is overwhelmed.

		const BATCH_SIZE = 20;
		const DELAY_BETWEEN_BATCHES_MS = 500;

		for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
			const batchedSubmissions = submissions.slice(i, i + BATCH_SIZE);
			// create database entries for the evaluations in the current batch
			const createdEvaluations = await Promise.all(
				batchedSubmissions.map(async (submission) => {
					const token = crypto.randomUUID();
					const evaluationEntry = await this.evaluationRepo.createEvaluation(submission.id, token, round);
					if (!evaluationEntry) {
						console.error(`[EVALUATION] Failed to create evaluation for submission ID: ${submission.id}`);
						return null;
					} else {
						return {
							id: evaluationEntry.id,
							apiUrl: submission.apiUrl,
							submissionId: evaluationEntry.submissionId,
							token: token,
						};
					}
				}),
			);

			for (const evaluation of createdEvaluations) {
				if (evaluation) {
					// do not await the call to the student API, let it run asynchronously. The evaluation status will be updated when the student API responds.
					this.callStudentApi(evaluation.id, evaluation.apiUrl, evaluation.token);
				}
			}

			// Delay before processing the next batch
			if (i + BATCH_SIZE < submissions.length) {
				await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
			}
		}
	}

	private async callStudentApi(evaluationId: number, apiUrl: string, evaluationToken: string) {
		const baseUrl =
			process.env.PUBLIC_COMPETITION_API_URL ||
			(process.env.DOMAIN ? `https://${process.env.DOMAIN}/api/competition` : null) ||
			`${process.env.CLIENT_URL}/api/competition`;
		const testDataDownloadEndpoint = `${baseUrl}/evaluations/${evaluationToken}/download`;
		const predictionUploadEndpoint = `${baseUrl}/evaluations/${evaluationToken}/upload`;

		const body = {
			testdata_download_endpoint: testDataDownloadEndpoint,
			prediction_upload_endpoint: predictionUploadEndpoint,
		};
		try {
			const studentPredictionEndpoint = apiUrl.endsWith("/") ? `${apiUrl}predict` : `${apiUrl}/predict`;
			const response = await fetch(`${studentPredictionEndpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(40000), // 40 seconds timeout for possible cold start of the student API
			});

			if (!response.ok) {
				throw new Error(`Student submission API call failed with status ${response.status}`);
			}
		} catch (error: any) {
			const errorMessage =
				error.name === "TimeoutError"
					? "Student submission API did not respond within 40 seconds"
					: error instanceof Error
						? error.message
						: String(error);
			console.error(`[EVALUATION] Evaluation ${evaluationId} Student API call failed: ${errorMessage}`);
			try {
				const updateDto: UpdateEvaluationDto = {
					status: EvaluationStatus.FAILED,
					error_message: errorMessage,
					completed_at: new Date(),
				};
				await this.evaluationRepo.updateEvaluationStatus(evaluationId, updateDto);
			} catch (error) {
				console.error(`[EVALUATION] Failed to update evaluation status to FAILED for ${evaluationId}: ${error}`);
			}
		}
	}

	private convertToNumericValue(value: unknown): number {
		if (value === null || value === undefined || value === "") {
			throw new BadRequestException("Prediction contains empty target values."); // must throw an error here, otherwise the score calculation will be incorrect and the student might get a better score by submitting an empty value.
		}
		switch (typeof value) {
			case "number":
				return value;
			case "boolean":
				return value ? 1 : 0;
			case "string":
				const str = String(value).trim();
				if (str === "") {
					throw new BadRequestException("Prediction contains empty target values.");
				}
				// handle boolean strings
				if (str.toLowerCase() === "true") return 1;
				if (str.toLowerCase() === "false") return 0;

				if (/^-?\d+,\d+$/.test(str)) {
					throw new BadRequestException(
						`Invalid numeric value '${str}'. Please use US float format with '.' as decimal separator.`,
					);
				}

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
