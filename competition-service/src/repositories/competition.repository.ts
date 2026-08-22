import { Database } from 'sqlite';
import { Competition, CreateCompetitionDto } from '../types/competition.types';
import { BaseRepo } from './base.repository';
/**
 * CompetitionRepo is a repository class that handles all database operations related to competitions.
 */
export class CompetitionRepo extends BaseRepo<Competition> {
    constructor (db: Database ) {
        super(db, 'competitions');
    };
    

    async createCompetition(dto: CreateCompetitionDto): Promise<Competition> {
        const sql = 'INSERT INTO competitions (name, description, start_date, end_date) VALUES (?, ?, ?, ?)';
        const result = (await this.db.run(sql, 
            [dto.name,
             dto.description, 
             dto.startDate, 
             dto.endDate])) as Competition | undefined;
        if (!result) {
            throw new Error('DB Error: Failed to create competition');
        }
        return result;
    }
}