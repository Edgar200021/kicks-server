import { randomUUID } from "node:crypto";
import { RedisContainer } from "@testcontainers/redis";
import Redis from "ioredis";
import { BodyMixin, Headers, request } from "undici";
import { expect } from "vitest";
import { buildApp } from "../src/app";
import { VERIFICATION_PREFIX } from "../src/common/const/redis";
import { deepFreeze } from "../src/common/utils/utils";
import { setupConfig } from "../src/config/config";
import { setupTestDb } from "./setupTestDb";

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;

export const omit = <T extends Record<string, unknown>>(
	obj: T,
	key: keyof T | (keyof T)[],
) => {
	const copied = structuredClone(obj);

	if (Array.isArray(key)) {
		for (const k of key) {
			delete copied[k];
		}
	} else {
		delete copied[key];
	}

	return copied;
};

const createTestApp = async () => {
	const config = setupConfig();

	const redisContainer = await new RedisContainer("redis:7")
		.withExposedPorts(6379)
		.start();

	config.redis.host = redisContainer.getHost();
	config.redis.port = redisContainer.getMappedPort(6379);
	config.redis.password = redisContainer.getPassword();

	config.database.name = `test-${randomUUID().toString()}`;

	config.rateLimit.signUpLimit = 15;

	deepFreeze(config);

	const { removeDb, db } = await setupTestDb(config.database);
	const redis = new Redis({
		host: config.redis.host,
		port: config.redis.port,
		password: config.redis.password,
	});
	const app = await buildApp(config);

	const address = await app.listen({ port: 0, host: "127.0.0.1" });

	return {
		async close() {
			await app.close();
			await db.destroy();
			await removeDb();
		},
		db,
		rateLimitConfig: config.rateLimit,

		async getVerificationToken() {
			return (await redis.keys("*"))
				.filter((key) => key.startsWith(VERIFICATION_PREFIX))
				.at(-1)
				?.split(VERIFICATION_PREFIX)
				.at(-1);
		},

		async signUp(body?: unknown) {
			return request(`${address}/api/v1/auth/sign-up`, {
				method: "POST",
				body,
				headers: new Headers({ "Content-Type": "application/json" }),
			});
		},

		async signIn(body?: unknown) {
			return request(`${address}/api/v1/auth/sign-in`, {
				method: "POST",
				body,
				headers: new Headers({ "Content-Type": "application/json" }),
			});
		},

		async verifyAccount(body?: unknown) {
			return request(`${address}/api/v1/auth/verify-account`, {
				method: "POST",
				body,
				headers: new Headers({ "Content-Type": "application/json" }),
			});
		},

		async createAndVerify(body?: unknown) {
			const response = await this.signUp(body);
			if (response.statusCode !== 201) {
				throw new Error("Failed to signup");
			}

			const token = await this.getVerificationToken();
			return request(`${address}/api/v1/auth/verify-account`, {
				method: "POST",
				body: JSON.stringify({
					token,
				}),
				headers: new Headers({ "Content-Type": "application/json" }),
			});
		},
	};
};

export const withTestApp = async (fn: (app: TestApp) => Promise<void>) => {
	let app: TestApp;
	try {
		app = await createTestApp();
		await fn(app);
	} finally {
		//@ts-expect-error
		await app?.close();
	}
};
