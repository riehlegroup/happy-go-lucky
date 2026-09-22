import fs from "fs";
import path from "path/win32";

export class DatasetPathResolver {
    private static readonly BASE_DATASET_PATH = process.env.DATASET_BASE_PATH || "storage/datasets";
    public static readonly UPLOAD_PATH = path.join(this.BASE_DATASET_PATH, "uploads");
    private static readonly PREPARED_PATH = path.join(this.BASE_DATASET_PATH, "prepared");

    /** 
     * tests if directory exists and creates it if not 
     */
    public static ensureBasePathExists() {
        if (!fs.existsSync(this.BASE_DATASET_PATH)) {
            fs.mkdirSync(this.BASE_DATASET_PATH, { recursive: true });
        }
    }
    /// ________ Uploaded dataset files  _________

    /**
     * Path to the uploaded dataset file for a given competition and dataset.
     */
    public static getUploadedDatasetPath(competitionId: number, datasetId: number, fileName: string): string {
        return path.join(this.UPLOAD_PATH, `comp_${competitionId}_ds_${datasetId}_${fileName}`);
    }

    // ________ Prepared dataset files (generated as setup before evaluation) _________
    /**
     * Path to the input CSV file for a given competition and dataset.
     */
    public static getInputCsvPath(competitionId: number, datasetId: number): string {
        return path.join(this.PREPARED_PATH, "comp_${competitionId}_ds_${datasetId}_input.csv");
    }
    
    /**
     * Path to the ground truth JSON file for a given competition and dataset.
     */
    public static getGroundTruthJsonPath(competitionId: number, datasetId: number): string {
        return path.join(this.PREPARED_PATH, "comp_${competitionId}_ds_${datasetId}_ground_truth.json");
    }
    /**
     * deletes the input CSV and ground truth JSON files for a given competition and dataset.
     */
    public static async deleteGeneratedDatasetFiles(competitionId: number, datasetId: number): Promise<void> {
        const inputCsvPath = this.getInputCsvPath(competitionId, datasetId);
        const groundTruthJsonPath = this.getGroundTruthJsonPath(competitionId, datasetId);
        const filesToDelete = [inputCsvPath, groundTruthJsonPath];

        await Promise.all(
            filesToDelete.map(async (filePath) => {
                try {
                    if (fs.existsSync(filePath)) {
                        await fs.promises.unlink(filePath);
                    }
                } catch (error: any) {
                    if (error.code !== "ENOENT") { // Ignore error if file does not exist
                        console.error(`Error deleting file ${filePath}:`, error);
                    }
                }
            }),
        );
    }
}