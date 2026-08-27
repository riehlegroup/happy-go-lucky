import { CompetitionRepo } from "../repositories/competition.repository";

/**
 * CompetitionService is responsible for handling business logic related to competitions
 */
export class CompetitionService {
    constructor(private competitionRepo: CompetitionRepo) {}

    async getAllCompetitions() {
        return this.competitionRepo.getAll();
    }

    async getCompetitionById(id: number) {
        return this.competitionRepo.getById(id);
    }

    async createCompetition(competitionData: any) {
        return this.competitionRepo.createCompetition(competitionData);
    }

}
    

