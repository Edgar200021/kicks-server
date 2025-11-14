import z from "zod";

export const redisConfigSchema = z.object({
	host: z.string(),
	port: z.coerce.number().min(1).max(65535),
	password: z.string(),
	db: z.coerce.number().min(0).optional(),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;
