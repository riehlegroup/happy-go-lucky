import { z } from "zod";

/**
 * Logs errors and handles validationerrors and sends appropriate error responses
 * @param error error object
 * @param message custom message for response
 * @param res res object of request
 * @param statusCode default 500, is ignored if error is validation error. Otherwise this status is used for the response
 * @returns 
 */
export function handleError(
	error: any,
	message: string,
	res: any,
	statusCode: number = 500,
) {
	console.error("error: ", message, error);
	if (error instanceof z.ZodError) {
		return res.status(400).json({
			success: false,
			message: "Validation failed",
			errors: z.treeifyError(error),
		});
	}
	res.status(statusCode).json({
		success: false,
		error: message,
	});
}

/**
 * Sends an error response with the given message and status code
 * @param message error message
 * @param statusCode HTTP status code
 * @param res res object of request
 * @returns 
 */
export function errorResponse(message: string, statusCode: number, res: any) {
	return res.status(statusCode).json({
		success: false,
		error: message,
	});
}
