import z from "zod";

export const mailerConfigSchema = z.object({
	host: z.string(),
	port: z.coerce.number(),
	secure: z.enum(["true", "false"]).transform((value) => value === "true"),
	user: z.string(),
	password: z.string(),
});

export type MailerConfig = z.infer<typeof mailerConfigSchema>;
