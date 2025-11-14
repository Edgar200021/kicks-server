import z from "zod";

export const loggerConfigSchema = z.object({
	level: z.enum(["info", "warn", "error", "fatal", "debug"]).optional(),
	structured: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type LoggerConfig = z.infer<typeof loggerConfigSchema>;
