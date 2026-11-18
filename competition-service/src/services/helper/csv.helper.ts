import * as fastCsv from "fast-csv";
import fs from "fs";
import readline from "readline";
import { RoundSummaryRow } from "../../repositories/evaluation.repository";

export const CSVFileHelper = {
	/**
	 * Detects the delimiter used in a CSV file by analyzing the first line of the file.
	 * @param file path to the CSV file
	 * @returns the detected delimiter
     * @throws Error if there is an issue reading the file or detecting the delimiter
	 */
	detectDelimiter: async (file: string): Promise<string> => {
		try {
			const fileStream = fs.createReadStream(file);
			const rl = readline.createInterface({
				input: fileStream,
				crlfDelay: Infinity,
			});

			let firstLine = "";
			for await (const line of rl) {
				firstLine = line;
				break; // Only read the first line
			}
            rl.close(); 
			if(!firstLine || firstLine.trim() === "") {
				throw new Error("File is empty or contains only whitespace. Cannot detect delimiter.");
			}
			const delimiters = [",", ";", "\t", "|"];
			// Count occurrences in the first line of the CSV file 
			let maxCount = 0;
			let detectedDelimiter = ",";
			for (const delimiter of delimiters) {
				const count = firstLine.split(delimiter).length - 1;
				if (count > maxCount) {
					maxCount = count;
					detectedDelimiter = delimiter;
				}
			}
			if(maxCount === 0) {
				throw new Error("No valid delimiter found in the first line of the CSV file. Ensure the CSV file has multiple columns separated by comma.");
			}
			return detectedDelimiter;
		} catch (error: any) {
			throw new Error(`Error while checking CSV file delimiter: ${error.message}`);
		}
	},

	/**
	 * Detects the delimiter used in a student prediction CSV file by analyzing the first line.
	 * @param csvString The CSV file line to analyze.
	 * @returns The detected delimiter.
	 */
	detectStudentPredictionDelimiter: (csvString: string): string => {
		const firstLine = csvString.split(/\r?\n/)[0] || "";
		const commaCount = (firstLine.match(/,/g) || []).length;
		const semicolonCount = (firstLine.match(/;/g) || []).length;
		const tabCount = (firstLine.match(/\t/g) || []).length;
		const pipeCount = (firstLine.match(/\|/g) || []).length;

		const counts = {
			",": commaCount,
			";": semicolonCount,
			"\t": tabCount,
			"|": pipeCount,
		};

		let detectedDelimiter = ",";
		let maxCount = 0;
		for (const [delimiter, count] of Object.entries(counts)) {
			if (count > maxCount) {
				maxCount = count;
				detectedDelimiter = delimiter;
			}
		}
		return detectedDelimiter;
	},

	/**
	 * Parses a CSV file line into a 2D array of strings.
	 * @param csvString The CSV file line to parse.
	 * @param delimiter The delimiter used in the CSV file line.
	 * @returns A promise that resolves to a 2D array of strings.
	 */
	parseCsv: async (csvString: string, delimiter: string = ","): Promise<string[][]> => {
		const rows: string[][] = [];
		await new Promise<void>((resolve, reject) => {
			fastCsv
				.parseString(csvString, { headers: false, delimiter: delimiter })
				.on("error", (error: Error) => reject(error))
				.on("data", (row) => rows.push(row))
				.on("end", () => resolve());
		});
		return rows;
	},

	/**
	 * Validates if two normalized (comma separated) CSV file lines have the same header structure and same number of columns and rows and are not empty.
	 * @param csvContent1 first csv file line with header row
	 * @param csvContent2 second csv file line with header row
	 * @returns true if the two CSV files have the same header structure and same number of columns and rows, false otherwise
	 */
	validateCSVFileStructure: (csvContent1: string[][], csvContent2: string[][]): boolean => {
		if (csvContent1.length !== csvContent2.length) {
			return false; // Different number of rows
		}
		if (csvContent1.length === 0 || csvContent2.length === 0) {
			return false; // One of the CSV files is empty
		}
		if (csvContent1[0].length !== csvContent2[0].length) {
			return false; // Different number of columns
		}
		const header1 = csvContent1[0];
		const header2 = csvContent2[0];
		for (let i = 0; i < header1.length; i++) {
			if (header1[i].trim() !== header2[i].trim()) {
				return false; // Different header structure
			}
		}
		return true;
	},

	/**
	 * Validates the structure of a round's input CSV file (header + time-series rows).
	 */
	validateInputDataset: (inputCsv: string[][]): boolean => {
		if (!inputCsv || inputCsv.length < 2 || !inputCsv[0] || inputCsv[0].length === 0) {
			return false;
		}
		const inputHeaders = new Set<string>();
		for (const h of inputCsv[0]) {
			const trimmed = h ? h.trim() : "";
			if (trimmed === "" || inputHeaders.has(trimmed)) {
				return false; // Empty or duplicate header in input CSV file
			}
			inputHeaders.add(trimmed);
		}
		return true;
	},

	/**
	 * Validates the structure of a round's ground truth CSV file (target headers + exactly 1 row of target values).
	 */
	validateGroundTruthDataset: (groundTruthCsv: string[][]): boolean => {
		if (!groundTruthCsv || groundTruthCsv.length !== 2 || !groundTruthCsv[0] || groundTruthCsv[0].length === 0) {
			return false;
		}
		const gtHeader = groundTruthCsv[0];
		const gtRow = groundTruthCsv[1];
		if (gtHeader.length !== gtRow.length) {
			return false;
		}
		const gtHeaders = new Set<string>();
		for (let j = 0; j < gtHeader.length; j++) {
			const trimmedHeader = gtHeader[j] ? gtHeader[j].trim() : "";
			if (trimmedHeader === "" || gtHeaders.has(trimmedHeader)) {
				console.error(`Duplicate or empty ground truth header at index ${j}: "${gtHeader[j]}"`);
				return false;
			}
			gtHeaders.add(trimmedHeader);
			const val = gtRow[j] ? gtRow[j].trim() : "";
			if (val === "" || /^-?\d+,\d+$/.test(val)) {
				console.error(`Empty or european comma decimal format ground truth value at index ${j}: "${gtRow[j]}"`);
				return false;
			}
		}
		return true;
	},

	/**
	 * Validates the structure of a round's input CSV file (header + time-series rows)
	 * and ground truth CSV file (target headers + exactly 1 row of target values).
	 * @param inputCsv parsed 2D array of the input CSV file
	 * @param groundTruthCsv parsed 2D array of the ground truth CSV file
	 * @returns true if both files match the expected round schema, false otherwise
	 */
	validateRoundDatasets: (inputCsv: string[][], groundTruthCsv: string[][]): boolean => {
		return CSVFileHelper.validateInputDataset(inputCsv) && CSVFileHelper.validateGroundTruthDataset(groundTruthCsv);
	},

	escapeCsvField: (value: unknown): string => {
		if (value === null || value === undefined) {
			return "";
		}
		const str = String(value);
		if (/[",\r\n]/.test(str)) { // If the string contains a comma, double quote, or newline, escape it
			return `"${str.replace(/"/g, '""')}"`; // Escape double quotes by doubling them and wrap the entire field in double quotes
		}
		return str;
	},

	writeRoundResultCSVFile: async (csvPath: string, rows: RoundSummaryRow[]): Promise<void> => {
		const header = "evaluationId,submissionId,userId,name,email,pseudonym,status,score,inferenceTimeMs,startedAt,completedAt,errorMessage\n";
		const csvLines = rows.map((row) =>
			[
				row.evaluationId,
				row.submissionId,
				row.userId,
				CSVFileHelper.escapeCsvField(row.name),
				CSVFileHelper.escapeCsvField(row.email),
				CSVFileHelper.escapeCsvField(row.pseudonym),
				CSVFileHelper.escapeCsvField(row.status),
				row.score ?? "",
				row.inference_time_ms ?? "",
				CSVFileHelper.escapeCsvField(row.started_at),
				CSVFileHelper.escapeCsvField(row.completed_at),
				CSVFileHelper.escapeCsvField(row.error_message),
			].join(","),
		);
		const content = header + (csvLines.length > 0 ? csvLines.join("\n") + "\n" : "");
		await fs.promises.writeFile(csvPath, content, "utf-8");
	},
};
