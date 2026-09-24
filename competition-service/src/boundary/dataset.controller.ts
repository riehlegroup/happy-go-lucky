import { DatasetService } from "../services/dataset.service";
import {
	Competition,
	Dataset,
	DatasetType,
	datasetTypeSchema as datasetTypeSchema,
	RoundDatasetResponseSchema,
	SingleDatasetResponseSchema,
} from "../types/competition.types";
import fs from "fs";
import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { BadRequestException } from "../errors/badrequest.error";
import { ForbiddenException } from "../errors/forbidden.error";
import { NotFoundException } from "../errors/notfound.error";

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
			const roundNumber = Number(req.query.round || req.body.round);
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

	async downloadDatasetsForCompetition(req: any, res: any) {
		try {
			const dataset = await this.authorizeAndGetDataset(req);

			res.download(dataset.file_path, dataset.file_name, (err: any) => {
				if (err) {
					handleError(err, "Failed to send dataset file", res);
				}
			});
		} catch (error) {
			handleError(error, "Failed to fetch datasets for competition", res);
		}
	}

	async getDatasetsMetadataForCompetition(req: any, res: any) {
		try {
			const dataset = await this.authorizeAndGetDataset(req);

			const responseDataset = SingleDatasetResponseSchema.parse(dataset);

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

	/**
	 * helper method to validate request and get the appropriate dataset.
	 * Datasettype must be provided as query parameter. Round number must be added as query parameter for INPUT and GROUND_TRUTH datasets, but not for TRAIN datasets.
	 * Input and Ground Truth datasets can only be downloaded by admins, while TRAIN datasets can be downloaded by all users.
	 * @param req req with competition and user attached by previous middleware, query parameters for dataset type and round number for INPUT and GROUND_TRUTH datasets.
	 * @returns Dataset object for the requested dataset type and round number.
	 * @throws BadRequestException if competition or user is not found in request, if round number is not provided for INPUT and GROUND_TRUTH datasets, or if round number is not a positive integer.
	 * @throws ForbiddenException if user is not an admin and tries to download INPUT or GROUND_TRUTH datasets.
	 * @throws NotFoundException if no dataset is found for the given parameters.
	 */
	private async authorizeAndGetDataset(req: any): Promise<Dataset> {
		const competition = req.competition as Competition; // Takes the competition from the previous middleware
		const user = req.user; // Takes the user from the previous middleware
		const validatedDatasetType = datasetTypeSchema.parse(req.query); // ignores round parameter if it is present but parses datatype to DatasetType enum

		if (!competition || !user) {
			throw new BadRequestException("Competition or user not found in request");
		}

		if (validatedDatasetType.type === DatasetType.TRAIN) {
			// round query parameter is not needed for TRAIN datasets
			const dataset = await this.datasetService.getTrainingDatasetForCompetition(competition.id); // throws NotFoundException if no dataset is found
			return dataset;
		}
		// For INPUT and GROUND_TRUTH datasets, only admins are allowed to download them
		if (user.userRole !== "ADMIN") {
			throw new ForbiddenException("Not allowed to download this type of dataset.");
		}
		// round query parameter is needed for INPUT and GROUND_TRUTH datasets, but not for TRAIN datasets
		const round = Number(req.query.round);
		if (isNaN(round) || round < 1) {
			throw new BadRequestException(
				"round request parameter is required for INPUT and GROUND_TRUTH datasets and must be a positive integer",
			);
		}
		const dataset = await this.datasetService.getDatasetForCompetitionRoundAndType(
			competition.id,
			round,
			validatedDatasetType.type,
		);

		return dataset;
	}
}
