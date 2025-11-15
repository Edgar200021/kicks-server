import z from "zod";

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		statusCode: z.number(),
		data,
	});