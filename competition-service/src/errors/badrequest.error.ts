import { HttpError } from "./http.error";

export class BadRequestException extends HttpError {
    public readonly statusCode = 400;
    public readonly error = "Bad Request";

    constructor(message: string = "Bad Request") {
        super(message);
    }
}