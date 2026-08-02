export enum CourseFeature {
    COMPETITION = "COMPETITION",
    STANDUPS = "STANDUPS",
    HAPPINESS_INDEX = "HAPPINESS_INDEX",
    CODE_ACTIVITY = "CODE_ACTIVITY",
    // Add more features as needed
}

export function isValidCourseFeature(value: unknown): value is CourseFeature {
    return typeof value === "string" && Object.values(CourseFeature).includes(value as CourseFeature);
}

export function validateCourseFeatures(input: unknown): CourseFeature[] {
    if (!Array.isArray(input)) {
        throw new Error("Input must be an array");
    }
    
    const invalidEntries = input.filter(item => !isValidCourseFeature(item));
    if (invalidEntries.length > 0) {
        throw new Error(`Invalid course features: ${invalidEntries.join(", ")}`);
    }
    
    return input as CourseFeature[];
}