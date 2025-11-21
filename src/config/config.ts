import z from "zod";
import { databaseConfigSchema } from "./database.config.js";
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
	logLevel: z.enum(["info", "warn", "error", "fatal", "debug"]).optional(),
	logStructured: z
		.enum(["true", "false"])
		.transform((value) => value === "true"),
	clientUrl: z.url().nonempty(),
	clientAccountVerificationPath: z.string().trim().nonempty(),
	clientResetPasswordPath: z.string().trim().nonempty(),
	verificationTokenTTLMinutes: z.coerce.number().min(60).max(1440),
	sessionTTLMinutes: z.coerce.number().min(1440).max(43800),
	oauthSessionTtlMinutes: z.coerce.number().min(60).max(1440),
	oauthStateTTlMinutes: z.coerce.number().min(1).max(3),
	resetPasswordTTLMinutes: z.coerce.number().min(5).max(10),
	sessionCookieName: z.string().nonempty(),
	oauthStateCookieName: z.string().nonempty(),
	cookieSecret: z.string().min(20).nonempty(),
	cookieSecure: z
		.enum(["true", "false"])
		.transform((value) => value === "true"),
	oauth2: z.object({
		google: z.object({
			clientId: z.string().nonempty(),
			clientSecret: z.string().nonempty(),
			redirectUrl: z.url(),
		}),
		facebook: z.object({
			clientId: z.string().nonempty(),
			clientSecret: z.string().nonempty(),
			redirectUrl: z.url(),
		}),
	}),
});

const configSchema = z.object({
	application: applicationConfigSchema,
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
			logLevel: process.env.APPLICATION_LOG_LEVEL,
			logStructured: process.env.APPLICATION_LOG_STRUCTURED,
			clientUrl: process.env.APPLICATION_CLIENTURL,
			clientAccountVerificationPath:
				process.env.APPLICATION_CLIENT_ACCOUNT_VERIFICATION_PATH,
			clientResetPasswordPath:
				process.env.APPLICATION_CLIENT_RESET_PASSWORD_PATH,
			verificationTokenTTLMinutes:
				process.env.APPLICATION_VERIFICATION_TOKEN_TTL_MINUTES,
			sessionTTLMinutes: process.env.APPLICATION_SESSION_TTL_MINUTES,
			oauthStateTTlMinutes: process.env.APPLICATION_OAUTH_STATE_TTL_MINUTES,
			resetPasswordTTLMinutes:
				process.env.APPLICATION_RESET_PASSWORD_TTL_MINUTES,
			oauthSessionTtlMinutes: process.env.APPLICATION_OAUTH_SESSION_TTL_MINUTES,
			cookieSecret: process.env.APPLICATION_COOKIE_SECRET,
			cookieSecure: process.env.APPLICATION_COOKIE_SECURE,
			sessionCookieName: process.env.APPLICATION_SESSION_COOKIE_NAME,
			oauthStateCookieName: process.env.APPLICATION_OAUTH_STATE_COOKIE_NAME,
			oauth2: {
				google: {
					clientId: process.env.APPLICATION_OAUTH_GOOGLE_CLIENT_ID,
					clientSecret: process.env.APPLICATION_OAUTH_GOOGLE_CLIENT_SECRET,
					redirectUrl: process.env.APPLICATION_OAUTH_GOOGLE_REDIRECT_URL,
				},
				facebook: {
					clientId: process.env.APPLICATION_OAUTH_FACEBOOK_CLIENT_ID,
					clientSecret: process.env.APPLICATION_OAUTH_FACEBOOK_CLIENT_SECRET,
					redirectUrl: process.env.APPLICATION_OAUTH_FACEBOOK_REDIRECT_URL,
				},
			},
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
			notFoundLimit: process.env.RATE_LIMIT_NOT_FOUND,
			signUpLimit: process.env.RATE_LIMIT_SIGN_UP,
			signInLimit: process.env.RATE_LIMIT_SIGN_IN,
			accountVerificationLimit: process.env.RATE_LIMIT_ACCOUNT_VERIFICATION,
			forgotPasswordLimit: process.env.RATE_LIMIT_FORGOT_PASSWORD,
			resetPasswordLimit: process.env.RATE_LIMIT_RESET_PASSWORD,
		},
	});
};
