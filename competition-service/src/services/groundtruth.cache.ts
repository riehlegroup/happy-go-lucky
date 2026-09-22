export type GroundTruthMap = Map<string, Record<string, any>>; // rowId -> { targetColumnName, value }

/**
 * GroundTruthCache is a singleton class that stores the ground truth data for competitions in memory.
 * It is used to avoid reading the dataset file multiple times during evaluation of submissions.
 */
class GroundTruthCache {
    private cache = new Map<number, GroundTruthMap>(); // competitionId -> GroundTruthMap for evaluation of more than one competition at the same time
    private timeouts = new Map<number, NodeJS.Timeout>(); 

    /**
     * Stores the ground truth data for a competition in RAM.
     * @param competitionId The ID of the competition.
     * @param data The ground truth data map.
     * @param ttl The time-to-live for the data in milliseconds. Default is 2 hours.
     */
    public set(competitionId: number, data: GroundTruthMap, ttl: number = 2*60*60*1000) { // default TTL is 2 hours
        this.delete(competitionId); // clear any existing data and timeout for this competition
        this.cache.set(competitionId, data);
        
        const timeout = setTimeout(() => {
            this.delete(competitionId);
        }, ttl);

        timeout.unref(); // allow the process to exit if this is the only active timer (Node.js will not wait for this timer to complete before exiting)
        this.timeouts.set(competitionId, timeout);
    }

    public get(competitionId: number): GroundTruthMap | undefined {
        return this.cache.get(competitionId);
    }

    public delete(competitionId: number) {
        this.cache.delete(competitionId);

        if (this.timeouts.has(competitionId)) {
            clearTimeout(this.timeouts.get(competitionId)!);
            this.timeouts.delete(competitionId);
        }
    }
}

export const groundTruthCache = new GroundTruthCache(); // makes it a singleton instance because instance is only created once and node caches the module.