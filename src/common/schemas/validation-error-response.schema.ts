import z from "zod";

export const ValidationErrorResponseSchema = z.object({
	statusCode: z.number(),
	errors: z.record(z.string(), z.string()),
});
