import { NotFoundException } from "../errors/notfound.error";
import { CompetitionRepo } from "../repositories/competition.repository";
import { UpdateCompetitionDto } from "../types/competition.types";
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

    async updateCompetition(id: number, competitionData: UpdateCompetitionDto) {
        return this.competitionRepo.updateCompetition(id, competitionData);
    }

    async getCompetitionByCourseId(courseId: number) {
       const competitions = await this.competitionRepo.getByCourseId(courseId);
       if (!competitions || competitions.length === 0) {
           throw new NotFoundException(`No competitions found for course ID ${courseId}`); 
       }
       if(competitions.length > 1) {
           throw new Error(`Multiple competitions found for course ID ${courseId}. Expected only one.`);
       }
       return competitions[0];
    }

}
    

