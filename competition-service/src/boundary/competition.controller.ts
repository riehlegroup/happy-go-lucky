import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { CompetitionService } from "../services/competition.service";
import {
	Competition,
	CreateCompetitionDto,
	CreateCompetitionSchema,
} from "../types/competition.types";

/**
 * CompetitionController is responsible for handling HTTP requests related to competitions
 */
export class CompetitionController {
	constructor(private competitionService: CompetitionService) {}

	async getAllCompetitions(req: any, res: any) {
		try {
			const competitions =
				await this.competitionService.getAllCompetitions();
			res.json(competitions);
		} catch (error) {
			handleError(error, "Failed to fetch competitions", res);
		}
	}

	async getCompetitionById(req: any, res: any) {
		// Competition is attached to the request object by the requireCompetitionExists middleware
		const competition: Competition = req.competition;

		if (competition) {
			res.json(competition);
		} else {
			errorResponse("Competition not found", 404, res);
		}
	}

	async createCompetition(req: any, res: any) {
		try {
			const competitionData: CreateCompetitionDto = CreateCompetitionSchema.parse(req.body);
			const newCompetition = await this.competitionService.createCompetition(competitionData);
			res.status(201).json(newCompetition);
		} catch (error) {
			handleError(error, "Failed to create competition", res);
		}
	}

    async getCompetitionByCourseId(req: any, res: any) {
        const { courseId } = req.params;
        const parsedCourseId = parseInt(courseId, 10);
        if (isNaN(parsedCourseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        try {
            const competition = await this.competitionService.getCompetitionByCourseId(parsedCourseId);
            res.status(200).json({ success: true, data: competition });
        } catch (error) {
            console.error("Error fetching competition by course ID:", error);
            res.status(500).json({ error: 'Failed to fetch competition for the course' });
        }
    }
}
