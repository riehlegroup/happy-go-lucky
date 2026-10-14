export abstract class HttpError extends Error {
    public abstract readonly statusCode: number;
    public abstract readonly error: string;

    constructor(message: string) {
        super(message);
        // Set the prototype explicitly to maintain the correct prototype chain for custom error classes (for example, when using instanceof checks).
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace?.(this, this.constructor);
    }

    public toJSON() {
        return {
            statusCode: this.statusCode,
            error: this.error,
            message: this.message,
        };
    } 
}