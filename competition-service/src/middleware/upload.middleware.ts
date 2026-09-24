import multer, { Field } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

export const createUploader = (
	sub_folder_name: string = "datasets",
	file_size_limit: number = 200 * 1024 * 1024, // 200MB max file size
	allowed_file_types: string[] = [
		"text/csv",
		"text/plain", //Fallback for some csv files that are detected as text/plain
	],
	allowed_file_extensions: string[] = [".csv"],
) => {
	const UPLOAD_FOLDER = path.join("uploads", sub_folder_name); // "uploads" has to be consistent with volume mapping in docker-compose.yml

	const createFolderIfNotExist = (folderPath: string) => {
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true });
		}
	};

	const storage = multer.diskStorage({
		destination: (req, file, cb) => {
			const competitionId = req.params.id || req.body.competitionId;
			const round = req.query.round;

			let folderPath = path.join(process.cwd(), UPLOAD_FOLDER, `competition_${String(competitionId)}`);

			if (round !== undefined && round !== null && round !== "") {
				folderPath = path.join(folderPath, `round_${String(round)}`);
			}

			createFolderIfNotExist(folderPath);
			cb(null, folderPath);
		},
		filename: (req, file, cb) => {
			// clean names with filename and timestamp to avoid collisions
			const fileExt = path.extname(file.originalname);
			const fileName =
				file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") + "-" + Date.now() + fileExt;
			cb(null, fileName);
		},
	});

	const roundUpload = multer({
		storage,
		limits: { fileSize: file_size_limit },
		fileFilter(req, file, cb) {
			const ext = path.extname(file.originalname).toLowerCase();
			const isExtAllowed = allowed_file_extensions.includes(ext);
			const isMimeAllowed = allowed_file_types.includes(file.mimetype);

			// Upload only if both the file extension and MIME type are allowed
			if (isExtAllowed && isMimeAllowed) {
				cb(null, true);
			} else {
				cb(new Error("This file format is not allowed. Please upload only CSV files."));
			}
		},
	});
	const studentPredictionUpload = multer({
		storage: multer.memoryStorage(), // Store the file in memory for immediate processing
		limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max file size
		fileFilter(req, file, cb) {
			const ext = path.extname(file.originalname).toLowerCase();
			const isExtAllowed = allowed_file_extensions.includes(ext);
			const isMimeAllowed = allowed_file_types.includes(file.mimetype);

			// Upload only if both the file extension and MIME type are allowed
			if (isExtAllowed && isMimeAllowed) {
				cb(null, true);
			} else {
				cb(new Error("This file format is not allowed. Please upload only CSV files."));
			}
		},
	});

	// Middleware funktion to handle single file upload with clean error handling
	return {
		// for single file upload (e.g. trainingdata)
		single: (fieldName: string) => {
			return (req: Request, res: Response, next: NextFunction) => {
				roundUpload.single(fieldName)(req, res, (err: any) => {
					if (err instanceof multer.MulterError) {
						if (err.code === "LIMIT_FILE_SIZE") {
							return res.status(400).json({ error: "File size exceeds the limit of 200MB." });
						}
						return res.status(400).json({ error: `Upload-error: ${err.message}` });
					} else if (err) {
						return res.status(400).json({ error: err.message });
					}
					next();
				});
			};
		},
		fields: (fields: Field[]) => {
			return (req: Request, res: Response, next: NextFunction) => {
				roundUpload.fields(fields)(req, res, (err: any) => {
					if (err instanceof multer.MulterError) {
						if (err.code === "LIMIT_FILE_SIZE") {
							return res.status(400).json({ error: "File size exceeds the limit of 200MB." });
						}
						return res.status(400).json({ error: `Upload-error: ${err.message}` });
					} else if (err) {
						return res.status(400).json({ error: err.message });
					}
					next();
				});
			};
		},
    singleStudentPrediction: (fieldName: string) => {
      return (req: Request, res: Response, next: NextFunction) => {
        studentPredictionUpload.single(fieldName)(req, res, (err: any) => {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return res.status(400).json({ error: "File size exceeds the limit of 20MB." });
            }
            return res.status(400).json({ error: `Upload-error: ${err.message}` });
          } else if (err) {
            return res.status(400).json({ error: err.message });
          }
          next();
        });
      };
    },
	};
};
export interface DatasetUploadMiddleware {
	single: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void;
	fields: (fields: Field[]) => (req: Request, res: Response, next: NextFunction) => void;
	singleStudentPrediction: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void;
}
