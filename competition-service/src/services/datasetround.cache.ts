import { NotFoundException } from "../errors/notfound.error";
import { DatasetRepo } from "../repositories/dataset.repository";
import fs from "fs";
import { CSVHelper } from "./helper/csv.helper";

export class DatasetRoundCache {
	private datasetRepo: DatasetRepo;

	constructor(datasetRepo: DatasetRepo) {
		this.datasetRepo = datasetRepo;
	}
	private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes sliding TTL (idle timeout) in milliseconds
	private cache = new Map<string, { groundTruthRows: string[][]; inputRows: string[][] }>();
	private timers = new Map<string, NodeJS.Timeout>();

	public async getOrLoadDatasets(competitionId: number, round: number) {
		const key = `${competitionId}_${round}`;
		if (this.cache.has(key)) {
			this.refreshTtl(key);
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
			CSVHelper.parseCsv(groundTruthCsv),
			CSVHelper.parseCsv(inputCsv),
		]);

		const cacheEntry = { groundTruthRows, inputRows };
		this.cache.set(key, cacheEntry);
		this.refreshTtl(key); // Start or reset the TTL timer for this cache entry
		return cacheEntry;
	}

	public clearCacheForCompetitionRound(competitionId: number, round: number) {
		const key = `${competitionId}_${round}`;
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key)!);
			this.timers.delete(key);
		}
		this.cache.delete(key);
	}

	private refreshTtl(key: string) {
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key)!);
		}
		const timer = setTimeout(() => {
			this.cache.delete(key);
			this.timers.delete(key);
		}, DatasetRoundCache.CACHE_TTL);
		timer.unref(); // allows the Node.js event loop to exit if this is the only active timer
		this.timers.set(key, timer);
	}
}