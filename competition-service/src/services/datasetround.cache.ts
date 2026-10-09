import { NotFoundException } from "../errors/notfound.error";
import { DatasetRepo } from "../repositories/dataset.repository";
import fs from "fs";
import fastCsv from "fast-csv";

export class DatasetRoundCache {
	private datasetRepo: DatasetRepo;

	constructor(datasetRepo: DatasetRepo) {
		this.datasetRepo = datasetRepo;
	}
	private cache = new Map<string, { groundTruthRows: string[][]; inputRows: string[][] }>();

	public async getOrLoadDatasets(competitionId: number, round: number) {
		const key = `${competitionId}_${round}`;
		if (this.cache.has(key)) {
			return this.cache.get(key)!;
		}
		const roundDatasets = await this.datasetRepo.getDatasetsForCompetitionRound(competitionId, round);
		const groundTruthDataset = roundDatasets.find((dataset) => dataset.dataset_type === "GROUND_TRUTH");
		const inputDataset = roundDatasets.find((dataset) => dataset.dataset_type === "INPUT");

		if (!groundTruthDataset || !inputDataset) {
			throw new NotFoundException(`Missing datasets for competition ${competitionId} and round ${round}`);
		}

		const [groundTruthCsv, inputCsv] = await Promise.all([
			fs.promises.readFile(groundTruthDataset.file_path, "utf-8"),
			fs.promises.readFile(inputDataset.file_path, "utf-8"),
		]);

		const [groundTruthRows, inputRows] = await Promise.all([
			this.parseCsv(groundTruthCsv),
			this.parseCsv(inputCsv),
		]);

		const cacheEntry = { groundTruthRows, inputRows };
		this.cache.set(key, cacheEntry);
		return cacheEntry;
	}

    public clearCacheForCompetitionRound(competitionId: number, round: number) {
        const key = `${competitionId}_${round}`;
        this.cache.delete(key);
    }

	private async parseCsv(csvString: string): Promise<string[][]> {
		const rows: string[][] = [];
		await new Promise<void>((resolve, reject) => {
			fastCsv
				.parseString(csvString, { headers: false })
				.on("error", (error) => reject(error))
				.on("data", (row) => rows.push(row))
				.on("end", () => resolve());
		});
		return rows;
	}
}