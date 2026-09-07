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

    async getCompetitionByCourseId(courseId: number) {
       const competitions = await this.competitionRepo.getByCourseId(courseId);
       if (!competitions || competitions.length === 0) {
           throw new Error(`No competitions found for course ID ${courseId}`);
       }
       if(competitions.length > 1) {
           throw new Error(`Multiple competitions found for course ID ${courseId}. Expected only one.`);
       }
       return competitions[0];
    }

}
    

