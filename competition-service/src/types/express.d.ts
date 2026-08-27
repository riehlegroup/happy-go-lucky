export {}; // This file is required to make this a module and avoid global scope pollution
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role?: string;
            };
        }
    }
}