import { HttpError } from "./http.error";

export class NotFoundException extends HttpError {
    public readonly statusCode = 404;
    public readonly error = "Not Found";

    constructor(message: string = "Not Found") {
        super(message);
    }
}