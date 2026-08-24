import multer from "multer";
import path from "path";
import fs from "fs";

export const createUploader = (
 sub_folder_name: string = "datasets",
 file_size_limit: number = 200 * 1024 * 1024, // 200MB max file size
 allowed_file_types: string[] = [
    "text/csv", 
    "application/json", 
    "application/x-yaml", 
    "text/yaml"
 ]
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

 return multer({
  storage,
  limits: { fileSize: file_size_limit },
  fileFilter(req, file, cb) {
   if (allowed_file_types.includes(file.mimetype)) {
    cb(null, true);
   } else {
    cb(new Error("Dieses Dateiformat ist nicht erlaubt. Bitte lade nur CSV, JSON oder YAML hoch."));
   }
  },
 });
};