import { DatasetService } from "../services/dataset.service";
import {
	Competition,
	Dataset,
	DatasetResponseSchema,
	DatasetType,
	datasetTypeSchema as datasetTypeSchema,
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

	async uploadDataset(req: any, res: any) {
		try {
			if (!req.file) {
				return errorResponse("No file uploaded", 400, res);
			}

			// Validate the request body using Zod schema
			const validatedData = datasetTypeSchema.parse(req.body);

			if (!req.competition) {
				return errorResponse("Competition not found in request", 400, res);
			}

			const datasetType = validatedData.type;
			const fileName = req.file.originalname;
			const filePath = req.file.path;


			// Call the service to handle the database entry. Dataset file ist already saved by multer in the upload middleware.
			const createdDataset = await this.datasetService.createDatabaseEntryForUploadedFile(
				req.competition,
				datasetType,
				fileName,
				filePath,
			);

			const responseDataset = DatasetResponseSchema.parse(createdDataset);

			res.status(201).json(responseDataset);
		} catch (error) {
			// If an error occurs, delete the uploaded file to avoid orphaned files
			if (req.file && fs.existsSync(req.file.path)) {
				fs.unlinkSync(req.file.path);
			}
			handleError(error, "Failed to upload dataset", res);
		}
	}

	async downloadDatasetsForCompetition(req: any, res: any) {
		try {
			const dataset = await this.authorizeAndGetDataset(req, res);


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
			const dataset = await this.authorizeAndGetDataset(req, res);

			const responseDataset = DatasetResponseSchema.parse(dataset);

			res.status(200).json(responseDataset);
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
			res.status(200).send();
		} catch (error) {
			handleError(error, "Failed to delete dataset", res);
		}
	}

	private async authorizeAndGetDataset(req: any, res: any): Promise<Dataset> {
		const competition = req.competition as Competition; // Takes the competition from the previous middleware
		const user = req.user; // Takes the user from the previous middleware
		const validatedDatasetType = datasetTypeSchema.parse(req.query); // query parameter for filtering by dataset type

		if (!competition || !user) {
			throw new BadRequestException("Competition or user not found in request");
		}

		// users can only download TRAIN datasets. Validation and test datasets are only used for evaluation and can only be accessed by admins.
		if (validatedDatasetType.type != DatasetType.TRAIN && user.userRole !== "ADMIN") {
			throw new ForbiddenException("Not allowed to download this type of dataset.");
		}

		const dataset = await this.datasetService.getDatasetsForCompetition(competition.id, validatedDatasetType.type);
		if (!dataset) {
			throw new NotFoundException("Dataset not found for the specified type");
		}
		return dataset;
	}



	//TODO: Implement way to get test data to student submissions for evaluation. Depending on evaluation strategy, this might be a separate endpoint or handled differently.
}
