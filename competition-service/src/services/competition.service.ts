import { CompetitionRepo } from "../repositories/competition.repository";

/**
 * CompetitionService is responsible for handling business logic related to competitions
 */
export class CompetitionService {
    constructor(private competitionRepo: CompetitionRepo) {}

    async getAllCompetitions() {
        // Implement logic to fetch all competitions from the repositor
        console.log("Fetching all competitions from the repository");
        return this.competitionRepo.getAll();
    }

    async getCompetitionById(id: number) {
        // Implement logic to fetch a competition by ID from the repository
        return this.competitionRepo.getById(id);
    }

    async createCompetition(competitionData: any) {
        // Implement logic to create a new competition in the repository
        return this.competitionRepo.createCompetition(competitionData);
    }

}
    

