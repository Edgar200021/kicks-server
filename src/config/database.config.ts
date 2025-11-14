import z from "zod";

export const databaseConfigSchema = z.object({
	name: z.string(),
	host: z.string(),
	port: z.coerce.number().min(1).max(65535),
	user: z.string(),
	password: z.string(),
	ssl: z.enum(["true", "false"]).transform((value) => value === "true"),
	poolMin: z.coerce.number().min(1).max(5).default(2).optional(),
	poolMax: z.coerce.number().min(1).max(10).default(10).optional(),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
