import z from "zod";
import { databaseConfigSchema } from "./database.config.js";
import { loggerConfigSchema } from "./logger.config.js";
import { mailerConfigSchema } from "./mailer.config.js";
import { rateLimitConfigSchema } from "./rate-limit.config.js";
import { redisConfigSchema } from "./redis.config.js";

declare module "fastify" {
	interface FastifyInstance {
		config: Config;
	}
}

const applicationConfigSchema = z.object({
	port: z.coerce.number().min(1).max(65535),
	clientUrl: z.url().nonempty(),
	clientAccountVerificationPath: z.string().trim().nonempty(),
	clientResetPasswordPath: z.string().trim().nonempty(),
	verificationTokenTTLMinutes: z.coerce.number().min(60).max(1440),
});

const configSchema = z.object({
	application: applicationConfigSchema,
	logger: loggerConfigSchema,
	database: databaseConfigSchema,
	redis: redisConfigSchema,
	mailer: mailerConfigSchema,
	rateLimit: rateLimitConfigSchema,
});

export type ApplicationConfig = z.infer<typeof applicationConfigSchema>;
export type Config = z.infer<typeof configSchema>;

export const setupConfig = (): Config => {
	return configSchema.parse({
		application: {
			port: process.env.APPLICATION_PORT,
			clientUrl: process.env.APPLICATION_CLIENTURL,
			clientAccountVerificationPath:
				process.env.APPLICATION_CLIENT_ACCOUNT_VERIFICATION_PATH,
			clientResetPasswordPath:
				process.env.APPLICATION_CLIENT_RESET_PASSWORD_PATH,
			verificationTokenTTLMinutes: process.env.VERIFICATION_TOKEN_TTL_MINUTES,
		},
		logger: {
			level: process.env.LOG_LEVEL,
			structured: process.env.LOG_STRUCTURED,
		},
		database: {
			name: process.env.DATABASE_NAME,
			host: process.env.DATABASE_HOST,
			port: process.env.DATABASE_PORT,
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			ssl: process.env.DATABASE_SSL,
			poolMin: process.env.DATABASE_POOL_MIN,
			poolMax: process.env.DATABASE_POOL_MAX,
		},
		redis: {
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
			password: process.env.REDIS_PASSWORD,
			db: process.env.REDIS_DB,
		},
		mailer: {
			host: process.env.NODEMAILER_HOST,
			port: process.env.NODEMAILER_PORT,
			secure: process.env.NODEMAILER_SECURE,
			user: process.env.NODEMAILER_USER,
			password: process.env.NODEMAILER_PASSWORD,
		},
		rateLimit: {
			globalLimit: process.env.RATE_LIMIT_GLOBAL,
		},
	});
};
