import { BadRequestException } from "../errors/badrequest.error";
import { CompetitionRepo } from "../repositories/competition.repository";
import { DatasetRepo } from "../repositories/dataset.repository";
import { EvaluationConfigRepo } from "../repositories/evaluationConfig.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import {
	Competition,
	Dataset,
	DatasetType,
	EvaluationConfig,
	EvaluationStatus,
	UpdateEvaluationDto,
} from "../types/competition.types";
import fs from "fs";
import fastCsv from "fast-csv";
import { groundTruthCache, GroundTruthMap } from "./groundtruth.cache";
import { DatasetPathResolver } from "./datasetpath.resolver";
import { EvaluationRepo } from "../repositories/evaluation.repository";

interface SplitResult {
	inputCsvFilePath: string;
	groundTruthJsonPath: string;
}

export class EvaluationService {
	private evaluationConfigRepo: EvaluationConfigRepo;
	private datasetRepo: DatasetRepo;
	private submissionRepo: SubmissionRepo;
	private competitionRepo: CompetitionRepo;
	private evaluationRepo: EvaluationRepo;

	constructor(
		evaluationConfigRepo: EvaluationConfigRepo,
		datasetRepo: DatasetRepo,
		submissionRepo: SubmissionRepo,
		competitionRepo: CompetitionRepo,
		evaluationRepo: EvaluationRepo,
	) {
		this.evaluationConfigRepo = evaluationConfigRepo;
		this.datasetRepo = datasetRepo;
		this.submissionRepo = submissionRepo;
		this.competitionRepo = competitionRepo;
		this.evaluationRepo = evaluationRepo;
	}

	async startEvaluation(competition: Competition, datasetType: DatasetType = DatasetType.TEST) {
		// check if the current date is within the competition's start and end dates
		const now = new Date();
		if (now < competition.startDate || now > competition.endDate) {
			throw new BadRequestException("Competition is not currently active");
		}
		// get the configuration for evaluation and its associated datasets from the database
		const evaluationConfig = await this.evaluationConfigRepo.getById(competition.evaluation_config_id);
		if (!evaluationConfig) {
			throw new Error("Evaluation configuration not found for the competition");
		}
		const datasets = await this.datasetRepo.getDatasetsForCompetitionAndType(competition.id, datasetType);
		if (!datasets || datasets.length === 0) {
			throw new Error(`No datasets found for competition ID ${competition.id} and dataset type ${datasetType}`);
		}
		//TODO: implement way to check which validation dataset should be used for evaluation. For now, we will just use the first one.
		const dataset = datasets[0];

		const splitResult = await this.createSeparatDatasets(competition.id, dataset, evaluationConfig);

		// split inputs from dataset and introduce id

		// call asynchrounously the requests to student apis
		console.log(`Starting evaluation for competition ID: ${competition.id}`);
		this.callSubmissionApis(competition.id);
	}

	/* parses the stored dataset file and prepares input data with id and splits the ground truth data from the dataset file. It creates and stores two separate dataset files: one for input data and one for ground truth data both with a unique id per row. Ground truth is also stored in GroundTruthCache for evaluation. */
	private async createSeparatDatasets(
		competitionId: number,
		dataset: Dataset,
		evaluationConfig: EvaluationConfig,
	): Promise<SplitResult> {
		const datasetFilePath = dataset.file_path;
		const inputCsvFilePath = DatasetPathResolver.getInputCsvPath(competitionId, dataset.id);
		const groundTruthJsonPath = DatasetPathResolver.getGroundTruthJsonPath(competitionId, dataset.id);

		const groundTruthMap: GroundTruthMap = new Map();
		const groundTruthObject: Record<string, Record<string, any>> = {}; // For writing to JSON file
		await DatasetPathResolver.ensureBasePathExists(); // Ensure the base path exists before writing files
		await DatasetPathResolver.deleteGeneratedDatasetFiles(competitionId, dataset.id); // Delete any existing generated files for this competition and dataset

		// streams for input csv file
		const writeStreamInput = fs.createWriteStream(inputCsvFilePath);
		const csvTransformStream = fastCsv.format({ headers: true });
		csvTransformStream.pipe(writeStreamInput);

		const targetColumnNames = evaluationConfig.target_columns.map((tc) => tc.target_column_name);
		let rowIndex = 1;
		let headersValidated = false;

		return new Promise<SplitResult>((resolve, reject) => {
			const readStream = fs.createReadStream(datasetFilePath);
			readStream
				.pipe(fastCsv.parse({ headers: true, trim: true }))
				.on("error", (error) => {
					csvTransformStream.end();
					reject("Error reading dataset file: " + error.message);
				})
				.on("data", (row: Record<string, any>) => {
					if (!headersValidated) {
						const availableColumns = Object.keys(row);
						const missingInputColumns = evaluationConfig.input_column_names.filter(
							(col) => !availableColumns.includes(col),
						);
						const missingTargetColumns = targetColumnNames.filter((col) => !availableColumns.includes(col));

						if (missingInputColumns.length > 0 || missingTargetColumns.length > 0) {
							csvTransformStream.end();
							readStream.destroy();
							return reject(
								new Error(
									`Dataset is missing required columns. Missing input columns: ${missingInputColumns.join(", ")}. Missing target columns: ${missingTargetColumns.join(", ")}`,
								),
							);
						}
						headersValidated = true;
					}
					const rowId = String(rowIndex++); // Use string for rowId for json keys
					// Prepare input data with ID (excluding target columns)
					const inputRow: Record<string, any> = { id: rowId };
					evaluationConfig.input_column_names.forEach((col) => {
						inputRow[col] = row[col];
					});
					csvTransformStream.write(inputRow);

					// Prepare ground truth data (only target columns with rowId)
					const targetValues: Record<string, any> = {};
					targetColumnNames.forEach((col) => {
						targetValues[col] = row[col];
					});
					groundTruthMap.set(rowId, targetValues);
					groundTruthObject[rowId] = targetValues;
				})
				.on("end", () => {
					//close the write stream for input csv file
					csvTransformStream.end();
					writeStreamInput.on("finish", async () => {
						try {
							// Write ground truth to JSON file
							await fs.promises.writeFile(groundTruthJsonPath, JSON.stringify(groundTruthObject, null, 2), "utf-8");
							// Store ground truth in cache
							groundTruthCache.set(competitionId, groundTruthMap);
							resolve({ inputCsvFilePath, groundTruthJsonPath });
						} catch (error) {
							reject(new Error("Error writing ground truth to JSON file: " + error));
						}
					});
				});
		});
	}

	private async callSubmissionApis(competitionId: number) {
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
		}));

		const createdEvaluations = await Promise.all(
			preparedEvaluations.map(async (evalData) => {
				const evaluation = await this.evaluationRepo.createEvaluation(evalData.submissionId, evalData.token);
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
		const clientUrl = process.env.CLIENT_URL || "http://localhost";
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
}
