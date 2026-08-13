export enum CourseFeature {
    COMPETITION = "COMPETITION",
    STANDUPS = "STANDUPS",
    HAPPINESS_INDEX = "HAPPINESS_INDEX",
    CODE_ACTIVITY = "CODE_ACTIVITY",
}

export const CourseFeatureDisplayNames: Record<CourseFeature, string> = {
    [CourseFeature.COMPETITION]: "Competition",
    [CourseFeature.STANDUPS]: "Standups",
    [CourseFeature.HAPPINESS_INDEX]: "Happiness Index",
    [CourseFeature.CODE_ACTIVITY]: "Code Activity",
};