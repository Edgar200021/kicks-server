import { randomUUID } from "node:crypto";
import path from "node:path";
import autoload from "@fastify/autoload";
import fastifySchedule from "@fastify/schedule";
import fastify, {
	type FastifyLoggerOptions,
	type RawServerBase,
} from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger.js";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { setupServices } from "@/features/index.js";
import {
	setupDatabaseClient,
	setupNodemailerClient,
	setupRedisClient,
} from "./common/clients/index.js";
import type { ApplicationConfig, Config } from "./config/config.js";
import { authRoutesV1 } from "./features/auth/routes/v1.js";
import { usersRoutesV1 } from "./features/users/routes/v1.js";
import { adminRoutesV1 } from "@/features/admin/routes/v1.js";

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

	app.register(fastifySchedule);
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

	const services = setupServices({
		redis: redisClient,
		db: dbClient,
		transporter: nodemailerClient,
		config: config.application,
		scheduler: app.scheduler,
	});

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
			instance.register(adminRoutesV1, { prefix: "/admin" });
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
