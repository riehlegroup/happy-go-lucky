import { DatasetService } from "../services/dataset.service";
import {
	Competition,
	DatasetResponseSchema,
	DatasetType,
	datasetTypeSchema as datasetTypeSchema,
} from "../types/competition.types";
import fs from "fs";
import { errorHandling } from "../errors/errorhandling.helper";

export class DatasetController {
	private datasetService: DatasetService;

	constructor(datasetService: DatasetService) {
		this.datasetService = datasetService;
	}

	async uploadDataset(req: any, res: any) {
		try {
			
			if (!req.file) {
				return res.status(400).json({ error: "No file uploaded" });
			}

			// Validate the request body using Zod schema
			const validatedData = datasetTypeSchema.parse(req.body);

			if (!req.competition) {
				return res
					.status(400)
					.json({ error: "Competition with given ID not found" });
			}

			const competitionId = req.competition.id;
			const datasetType = validatedData.type;
			const fileName = req.file.originalname;
			const filePath = req.file.path;

			// Call the service to handle the database entry. Dataset file ist already saved by multer in the upload middleware.
			const createdDataset =
				await this.datasetService.createDatabaseEntryForUploadedFile(
					competitionId,
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
            console.error("Error uploading dataset:", error);
            errorHandling(error, "Failed to upload dataset", res);
		}
	}

	async getDatasetsForCompetition(req: any, res: any) {
		try {
			const competition = req.competition as Competition; // Takes the competition from the previous middleware

			const validatedDatasetType = datasetTypeSchema.parse(req.query); // query parameter for filtering by dataset type

			if (validatedDatasetType.type === DatasetType.TEST) {
				return res.status(400).json({
					success: false,
					error: "Invalid dataset type. Must be 'TRAIN' or 'VALIDATION'.",
				});
			}

			const dataset =
				await this.datasetService.getDatasetsForCompetition(
					competition.id,
					validatedDatasetType.type,
				);

			res.download(dataset.file_path, dataset.file_name, (err: any) => {
                if (err) {
                    console.error("Error sending file:", err);
                    res.status(500).json({ error: "Failed to send File" });
                }
            });

		} catch (error) {
			console.error("Error fetching datasets for competition:", error);
            errorHandling(error, "Failed to fetch datasets for competition", res);
        }
	}

	//TODO: Implement way to get test data to student submissions for evaluation. Depending on evaluation strategy, this might be a separate endpoint or handled differently.

}


