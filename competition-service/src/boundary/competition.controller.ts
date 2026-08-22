import { CompetitionService } from "../services/competition.service";
import { CreateCompetitionDto, CreateCompetitionSchema } from "../types/competition.types";
import { z } from "zod";


/**
 * CompetitionController is responsible for handling HTTP requests related to competitions
 */
export class CompetitionController {
    constructor(private competitionService: CompetitionService) {};

    async getAllCompetitions(req: any, res: any) {
        try {
            console.log("inside getAllCompetitions controller method");
            const competitions = await this.competitionService.getAllCompetitions();
            res.json(competitions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch competitions' });
        }
    }
    
    async getCompetitionById(req: any, res: any) {
        console.log("inside getCompetitionById controller method");
        const { id } = req.params;
        const competitionId = parseInt(id, 10);
        if (isNaN(competitionId)) {
            return res.status(400).json({ error: 'Invalid competition ID' });
        }


        try {
            const competition = await this.competitionService.getCompetitionById(competitionId);
            if (competition) {
                res.json(competition);
            } else {
                res.status(404).json({ error: 'Competition not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch competition' });
        }

    }

    async createCompetition(req: any, res: any) {
        try {
            const competitionData: CreateCompetitionDto = CreateCompetitionSchema.parse(req.body);
            const newCompetition = await this.competitionService.createCompetition(competitionData);
            res.status(201).json(newCompetition);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ 
                    success: false,
                    message: "Validation failed",
                    errors: z.treeifyError(error)
                });
            }
            res.status(500).json({ error: 'Failed to create competition' });
        }
    }
}
