import { HttpError } from "./http.error";

export class ForbiddenException extends HttpError {
    public readonly statusCode = 403;
    public readonly error = "Forbidden";

    constructor(message: string = "Forbidden") {
        super(message);
    }
}