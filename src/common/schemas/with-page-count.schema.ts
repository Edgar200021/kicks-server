import z from "zod";

export const WithPageCountSchema = <T extends z.ZodTypeAny>(
	key: string,
	data: T,
) =>
	z.object({
		pageCount: z.number().gte(0),
		[key]: data,
	});
