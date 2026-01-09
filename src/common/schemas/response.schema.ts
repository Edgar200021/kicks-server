import z from "zod";

export const ErrorResponseSchema = z.object({
	statusCode: z.number(),
	error: z.string(),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		statusCode: z.number(),
		data,
	});

export const ValidationErrorResponseSchema = z.object({
	statusCode: z.number(),
	errors: z.record(z.string(), z.string()),
});
