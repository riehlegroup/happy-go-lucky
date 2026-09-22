import { CompetitionRepo } from "../repositories/competition.repository";
import { CreateCompetitionDto } from "../types/competition.types";

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

    async createCompetition(competitionData: CreateCompetitionDto) {
        return this.competitionRepo.createCompetition(competitionData);
    }

}
    

