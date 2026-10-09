import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { CompetitionService } from "../services/competition.service";
import {
	Competition,
	CompetitionOutboundDtoSchema,
	CreateCompetitionDto,
	CreateCompetitionSchema,
	UpdateCompetitionDto,
	UpdateCompetitionSchema,
} from "../types/competition.types";

/**
 * CompetitionController is responsible for handling HTTP requests related to competitions. It only handles request that modify, fetch or create competition entities. All other requests related to existing competitions (e.g. submissions, datasets, etc.) are handled by their respective controllers.
 */
export class CompetitionController {
	constructor(private competitionService: CompetitionService) {}

	async getAllCompetitions(req: any, res: any) {
		try {
			const competitions = await this.competitionService.getAllCompetitions();
			const outboundCompetitions = competitions.map((competition) => CompetitionOutboundDtoSchema.parse(competition));
			res.json(outboundCompetitions);
		} catch (error) {
			handleError(error, "Failed to fetch competitions", res);
		}
	}

	async getCompetitionById(req: any, res: any) {
        try {
		// Competition is attached to the request object by the requireCompetitionExists middleware
		const competition: Competition = req.competition;

		if (competition) {
			const outboundCompetition = CompetitionOutboundDtoSchema.parse(competition);
			res.json(outboundCompetition);
		} else {
			errorResponse("Competition not found", 404, res);
		}
        } catch (error) {
            handleError(error, "Failed to fetch competition by ID", res);
        }
	}

	async createCompetition(req: any, res: any) {
		try {
			const competitionData: CreateCompetitionDto = CreateCompetitionSchema.parse(req.body);
			const newCompetition = await this.competitionService.createCompetition(competitionData);
			const outboundCompetition = CompetitionOutboundDtoSchema.parse(newCompetition);
			res.status(201).json(outboundCompetition);
		} catch (error) {
			handleError(error, "Failed to create competition", res);
		}
	}

	async updateCompetition(req: any, res: any) {
		const { id } = req.params;
		const competitionId = parseInt(id, 10);
		if (isNaN(competitionId) || competitionId < 0) {
			return errorResponse("Invalid competition ID", 400, res);
		}

		try {
			const competitionData: UpdateCompetitionDto = UpdateCompetitionSchema.parse(req.body);
			const updatedCompetition = await this.competitionService.updateCompetition(competitionId, competitionData);
			const outboundCompetition = CompetitionOutboundDtoSchema.parse(updatedCompetition);
			res.status(200).json(outboundCompetition);
		} catch (error) {
			handleError(error, "Failed to update competition", res);
		}
	}

	/**
	 * This endpoint is needed for the first fetch of competition data where only courseId is known.
	 * It relies on the assumption that there is only one competition per course.
	 *  If there is the possibility of multiple competitions per course in the future, this endpoint must be changed.
	 */
	async getCompetitionByCourseId(req: any, res: any) {
		const { courseId } = req.params;
		const parsedCourseId = parseInt(courseId, 10);
		if (isNaN(parsedCourseId) || parsedCourseId < 0) {
			return errorResponse("Invalid course ID", 400, res);
		}

		try {
			const competition = await this.competitionService.getCompetitionByCourseId(parsedCourseId);
			const outboundCompetition = CompetitionOutboundDtoSchema.parse(competition);
			res.status(200).json(outboundCompetition);
		} catch (error) {
			handleError(error, "Failed to fetch competition for the course", res);
		}
	}
}
