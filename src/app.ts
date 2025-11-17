import { randomUUID } from "node:crypto";
import path from "node:path";
import autoload from "@fastify/autoload";
import fastify, {
	type FastifyLoggerOptions,
	type RawServerBase,
} from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger.js";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import {
	setupDatabaseClient,
	setupNodemailerClient,
	setupRedisClient,
} from "./common/clients/index.js";
import { EmailService } from "./common/services/email.service.js";
import { OAuth2Service } from "./common/services/oauth2.service.js";
import type { ApplicationConfig, Config } from "./config/config.js";
import { authRoutesV1 } from "./features/auth/routes/v1/auth.routes.js";
import { AuthService } from "./features/auth/service/auth.service.js";
import { UsersRepository } from "./features/users/repository/users.repository.js";
import { usersRoutesV1 } from "./features/users/routes/v1/users.routes.js";

declare module "fastify" {
	interface FastifyInstance {
		services: {
			authService: AuthService;
		};
	}
}

const loggerOptions = (
	config: ApplicationConfig,
): FastifyLoggerOptions<RawServerBase> & PinoLoggerOptions => {
	return {
		level: config.logLevel,
		formatters: {
			level(level) {
				return { level };
			},
		},
		transport: {
			target: config.logStructured ? "pino/file" : "pino-pretty",
			options: config.logStructured
				? {}
				: {
						colorize: true,
						ignore: "pid,hostname",
						translateTime: "HH:MM:ss Z",
					},
		},
		redact: {
			paths: [
				"req.headers.authorization",
				"req.body.password",
				"req.body.email",
				"password",
			],
			censor: "***",
		},
		base: { pid: process.pid },
		serializers: {
			req(req) {
				return {
					method: req.method,
					url: req.url,
					host: req.host,
					remoteAddress: req.ip,
					remotePort: req.socket.remotePort,
					agent: req.headers["user-agent"],
				};
			},
			res(reply) {
				return {
					statusCode: reply.statusCode,
					user: reply.request?.user?.id,
				};
			},
		},
	};
};

export const buildApp = async (config: Config) => {
	const app = fastify({
		logger: loggerOptions(config.application),
		genReqId: () => randomUUID().toString(),
	});

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.decorate("config", config);

	await app.register(autoload, {
		dir: path.join(import.meta.dirname, "plugins/external"),
		options: { ...app.options },
		encapsulate: false,
	});

	const [dbClient, redisClient, nodemailerClient] = await Promise.all([
		setupDatabaseClient(config.database),
		setupRedisClient(config.redis),
		setupNodemailerClient(config.mailer),
	]);

	const usersRepository = new UsersRepository(dbClient);

	const emailService = new EmailService(nodemailerClient, config.application);
	const oauth2Service = new OAuth2Service(config.application);

	const services = {
		authService: new AuthService(
			usersRepository,
			emailService,
			oauth2Service,
			redisClient,
			config.application,
		),
	};

	app.decorate<typeof services>("services", services);

	await app.register(autoload, {
		dir: path.join(import.meta.dirname, "plugins/internal"),
		options: { ...app.options },
		encapsulate: false,
	});

	app.register(
		(instance) => {
			instance.register(authRoutesV1, { prefix: "/auth" });
			instance.register(usersRoutesV1, { prefix: "/user" });
		},
		{
			prefix: "/api/v1",
		},
	);

	app.addHook("onClose", async () => {
		await Promise.all([dbClient.destroy(), redisClient.quit()]);
		nodemailerClient.close();
	});

	await app.ready();

	return app;
};
