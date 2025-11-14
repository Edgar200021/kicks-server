import z from "zod";

export const rateLimitConfigSchema = z.object({
	globalLimit: z.coerce.number().min(10).max(100).default(100).optional(),
});
