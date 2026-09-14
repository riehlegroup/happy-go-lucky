import multer from "multer";
import path from "path";
import fs from "fs";
import {Request, Response, NextFunction } from "express";

export const createUploader = (
 sub_folder_name: string = "datasets",
 file_size_limit: number = 200 * 1024 * 1024, // 200MB max file size
 allowed_file_types: string[] = [
    "text/csv", 
    "application/json", 
    "application/x-yaml", 
    "text/yaml",
    "text/plain" //Fallback for some csv files that are detected as text/plain
 ],
 allowed_file_extensions: string[] = [".csv", ".json", ".yaml", ".yml"],
) => {
 
 const UPLOAD_FOLDER = path.join("uploads", sub_folder_name); // "uploads" has to be consistent with volume mapping in docker-compose.yml

 const createFolderIfNotExist = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
   fs.mkdirSync(folderPath, { recursive: true });
  }
 };

 const storage = multer.diskStorage({
  destination: (req, file, cb) => {
   const folderPath = path.join(process.cwd(), UPLOAD_FOLDER);
   createFolderIfNotExist(folderPath); 
   cb(null, folderPath);
  },
  filename: (req, file, cb) => {
   // Erzeugt saubere Dateinamen: "mein dataset.csv" -> "mein-dataset-1692837465.csv" damit Dateien nicht ausversehen überschrieben werden
   const fileExt = path.extname(file.originalname);
   const fileName =
    file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") +
    "-" +
    Date.now() +
    fileExt;
   cb(null, fileName);
  },
 });

 const upload = multer({
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
        cb(new Error("This file format is not allowed. Please upload only CSV, JSON or YAML files."));
      }
    },
  });

  // Middleware funktion to handle single file upload with clean error handling
  return {
    single: (fieldName: string) => {
      return (req: Request, res: Response, next: NextFunction) => {
        upload.single(fieldName)(req, res, (err: any) => {
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
  };
};