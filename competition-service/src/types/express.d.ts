export {}; // This file is required to make this a module and avoid global scope pollution
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role?: string;
            };
            competition?: {
                id: number;
                name: string;
                courseId: number;
                description: string;
                startDate: Date;
                endDate: Date;
            };
        }
    }
}