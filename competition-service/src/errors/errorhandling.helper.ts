import { z } from "zod";

export function errorHandling(error: any, message: string, res: any) {
	if (error instanceof z.ZodError) {
		return res.status(400).json({
			success: false,
			message: "Validation failed",
			errors: z.treeifyError(error),
		});
	}
	res.status(500).json({
		error: message,
	});
}