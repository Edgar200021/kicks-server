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
import { setupDatabase } from "./common/database.js";
import { setupNodemailer } from "./common/nodemailer.js";
import { setupRedis } from "./common/redis.js";
import { createEmailService } from "./common/services/email.service.js";
import type { Config } from "./config/config.js";
import type { LoggerConfig } from "./config/logger.config.js";
import { authRoutesV1 } from "./features/auth/routes/v1/auth.routes.js";
import {
	type AuthService,
	createAuthService,
} from "./features/auth/service/auth.service.js";
import { createUsersRepository } from "./features/users/repository/users.repository.js";

declare module "fastify" {
	interface FastifyInstance {
		services: {
			authService: AuthService;
		};
	}
}
const loggerOptions = (
	config: LoggerConfig,
): FastifyLoggerOptions<RawServerBase> & PinoLoggerOptions => {
	return {
		level: config.level,
		formatters: {
			level(_, number) {
				return { level: number };
			},
		},
		transport: {
			target: config.structured ? "pino/file" : "pino-pretty",
			options: config.structured
				? {}
				: {
						colorize: true,
						ignore: "pid,hostname",
						translateTime: "HH:MM:ss Z",
					},
		},
		redact: { paths: ["password"], remove: true },
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
		},
	};
};

export const buildApp = async (config: Config) => {
	const app = fastify({
		logger: loggerOptions(config.logger),
		genReqId: () => randomUUID().toString(),
	});

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.decorate("config", config);

	await app.register(autoload, {
		dir: path.join(import.meta.dirname, "plugins"),
		options: { ...app.options },
		encapsulate: false,
	});

	const db = await setupDatabase(config.database);
	const redis = await setupRedis(config.redis);

	const nodemailer = await setupNodemailer(config.mailer);

	const usersRepository = createUsersRepository(db);

	const emailService = createEmailService(nodemailer, config.application);

	const services = {
		authService: createAuthService({
			usersRepository,
			redis,
			config,
			emailService,
		}),
	};

	app.decorate<typeof services>("services", services);

	app.register(
		(instance) => {
			instance.register(authRoutesV1, { prefix: "/auth" });
		},
		{
			prefix: "/api/v1",
		},
	);

	app.addHook("onClose", async () => {
		await Promise.all([db.destroy(), redis.quit()]);
		nodemailer.close();
	});

	await app.ready();

	return app;
};
