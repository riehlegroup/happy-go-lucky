import { DatasetService } from "../services/dataset.service";
import {
	Competition,
	DatasetType,
	datasetTypeSchema as datasetTypeSchema,
	RoundDatasetResponseSchema,
	SingleDatasetResponseSchema,
} from "../types/competition.types";
import fs from "fs";
import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { BadRequestException } from "../errors/badrequest.error";
import { z } from "zod";


export class DatasetController {
	private datasetService: DatasetService;

	constructor(datasetService: DatasetService) {
		this.datasetService = datasetService;
	}

	async uploadTrainingDataset(req: any, res: any) {
		try {
			if (!req.file) {
				return errorResponse("No file uploaded", 400, res);
			}

			if (!req.competition) {
				return errorResponse("Competition not found in request", 400, res);
			}

			const competitionId = req.competition.id;
			const datasetType = DatasetType.TRAIN;
			const fileName = req.file.originalname;
			const filePath = req.file.path;

			// Call the service to handle the database entry. Dataset file ist already saved by multer in the upload middleware.
			const createdDataset = await this.datasetService.createDatabaseEntryForUploadedFile(
				competitionId,
				datasetType,
				fileName,
				filePath,
			);

			const responseDataset = SingleDatasetResponseSchema.parse(createdDataset);

			res.status(201).json(responseDataset);
		} catch (error) {
			// If an error occurs, delete the uploaded file to avoid orphaned files
			if (req.file && fs.existsSync(req.file.path)) {
				fs.unlinkSync(req.file.path);
			}
			handleError(error, "Failed to upload training dataset", res);
		}
	}

	async uploadDatasetsForCompetitionRound(req: any, res: any) {
		try {
			const roundNumber = Number(req.params.round || req.body.round);
			const competition = req.competition as Competition;

			const inputFile = req.files?.inputFile?.[0];
			const groundTruthFile = req.files?.groundTruthFile?.[0];

			if (isNaN(roundNumber) || roundNumber < 1) {
				throw new BadRequestException("Invalid round number");
			}
			if (!competition) {
				throw new BadRequestException("Competition not found in request");
			}
			if (!inputFile || !groundTruthFile) {
				throw new BadRequestException("File missing, please upload both input and ground truth files");
			}

			// Call the service to handle the database entry. Dataset file ist already saved by multer in the upload middleware.
			const createdInputDataset = await this.datasetService.createDatabaseEntryForUploadedFile(
				competition.id,
				DatasetType.INPUT,
				inputFile.originalname,
				inputFile.path,
				roundNumber,
			);
			const createdGroundTruthDataset = await this.datasetService.createDatabaseEntryForUploadedFile(
				competition.id,
				DatasetType.GROUND_TRUTH,
				groundTruthFile.originalname,
				groundTruthFile.path,
				roundNumber,
			);

			const datasets = [createdInputDataset, createdGroundTruthDataset];

			const responseDataset = RoundDatasetResponseSchema.parse({ datasets });

			res.status(201).json(responseDataset);
		} catch (error) {
			// If an error occurs, delete the uploaded file to avoid orphaned files
			let inputFile = req.files?.inputFile?.[0];
			let groundTruthFile = req.files?.groundTruthFile?.[0];
			if (inputFile && fs.existsSync(inputFile.path)) fs.unlinkSync(inputFile.path);
			if (groundTruthFile && fs.existsSync(groundTruthFile.path)) fs.unlinkSync(groundTruthFile.path);

			handleError(error, "Failed to upload dataset", res);
		}
	}

	async downloadDataset(req: any, res: any) {
		try {
			const competition = req.competition as Competition
			const datasetId = Number(req.params.datasetId);
			const user = req.user;
			if (isNaN(datasetId) || datasetId < 0) {
				return errorResponse("Invalid dataset ID", 400, res);
			}
			if (!user || !competition) {
				return errorResponse("Missing user or competition information", 400, res);
			}
			const dataset = await this.datasetService.getDatasetById(datasetId);

			if(dataset.competitionId !== competition.id) {
				return errorResponse("Dataset does not belong to this competition", 403, res);
			}

			if(dataset.dataset_type !== DatasetType.TRAIN && user.userRole !== "ADMIN") {
				return errorResponse("Not allowed to download this type of dataset.", 403, res);
			}
			
			res.download(dataset.file_path, dataset.file_name, (err: any) => {
				if (err) {
					handleError(err, "Failed to send dataset file", res);
				}
			});
		} catch (error) {
			handleError(error, "Failed to fetch datasets for competition", res);
		}
	}

	async getAllDatasetMetadataFilteredByParams(req: any, res: any) {
		try {
			const competition = req.competition as Competition;
			const user = req.user;
			if (!competition || !user) {
				return errorResponse("Competition or user not found in request", 400, res);
			}
			let round = undefined;
			let datasetType = undefined;
			if(req.query.round !== undefined && req.query.round !== null && req.query.round !== "") {
				round = Number(req.query.round);
				if (isNaN(round) || round < 1) {
					return errorResponse("Invalid round number", 400, res);
				}
			}
			if(req.query.type !== undefined && req.query.type !== null && req.query.type !== "") {
				let parsedDatasetType = z.enum(DatasetType).safeParse(req.query.type);
				if (!parsedDatasetType.success) {
					return errorResponse("Invalid dataset type", 400, res);
				}
				datasetType = parsedDatasetType.data;
			}

			const datasets = await this.datasetService.getDatasetsForCompetition(competition.id, user.userRole, round, datasetType);
			
			const responseDataset = datasets.map(dataset => SingleDatasetResponseSchema.parse(dataset));

			return res.status(200).json(responseDataset);
		} catch (error) {
			handleError(error, "Failed to fetch datasets metadata for competition", res);
		}
	}

	async deleteDataset(req: any, res: any) {
		try {
			const datasetId = Number(req.params.datasetId);
			if (isNaN(datasetId)) {
				return errorResponse("Invalid dataset ID", 400, res);
			}
			const deleted = await this.datasetService.deleteDatasetById(datasetId);
			if (!deleted) {
				return errorResponse("Dataset not found", 404, res);
			}
			res.status(204).send();
		} catch (error) {
			handleError(error, "Failed to delete dataset", res);
		}
	}
}
