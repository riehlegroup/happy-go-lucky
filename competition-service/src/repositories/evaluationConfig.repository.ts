import { EvaluationConfig } from "../types/competition.types";
import { BaseRepo } from "./base.repository";



export class EvaluationConfigRepo extends BaseRepo<EvaluationConfig> {
    constructor(db: any) {
        super(db, "competition_evaluation_configs");
    }

}