import z from "zod";

export const rateLimitConfigSchema = z.object({
	globalLimit: z.coerce.number().min(10).max(100).default(100).optional(),
	notFoundLimit: z.coerce.number().min(3).max(5).default(5).optional(),
	signUpLimit: z.coerce.number().min(5).max(8).default(5).optional(),
	signInLimit: z.coerce.number().min(5).max(15).default(10).optional(),
	accountVerificationLimit: z.coerce
		.number()
		.min(3)
		.max(5)
		.default(3)
		.optional(),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
