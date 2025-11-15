import { randomUUID } from "node:crypto";
import { RedisContainer } from "@testcontainers/redis";
import Redis from "ioredis";
import { type Dispatcher, Headers, request } from "undici";
import type { UndiciHeaders } from "undici/types/dispatcher.js";
import { buildApp } from "../src/app.js";
import { VERIFICATION_PREFIX } from "../src/common/const/index.js";
import { deepFreeze } from "../src/common/utils/index.js";
import { setupConfig } from "../src/config/config.js";
import { setupTestDb } from "./setupTestDb.js";

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;
type RequestOptions = Partial<Omit<Dispatcher.RequestOptions, "method">>;

const buildHeaders = (headers?: UndiciHeaders) => {
	return (
		Array.isArray(headers)
			? headers
			: headers instanceof Headers
				? Array.from(headers.entries())
				: headers && typeof headers === "object"
					? Object.entries(headers)
					: []
	).reduce(
		(result, [key, value]) => {
			if (Array.isArray(value)) {
				for (const v of value) {
					result.set(key, v);
				}
			} else if (value != null) {
				result.set(key, value);
			}
			return result;
		},
		new Headers({ "Content-Type": "application/json" }),
	);
};

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
		applicationConfig: config.application,

		async getVerificationToken() {
			return (await redis.keys("*"))
				.filter((key) => key.startsWith(VERIFICATION_PREFIX))
				.at(-1)
				?.split(VERIFICATION_PREFIX)
				.at(-1);
		},

		async signUp(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/sign-up`, {
				method: "POST",
				...options,
				headers: buildHeaders(options?.headers),
			});
		},

		async signIn(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/sign-in`, {
				method: "POST",
				...options,
				headers: buildHeaders(options?.headers),
			});
		},

		async verifyAccount(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/verify-account`, {
				method: "POST",
				...options,
				headers: buildHeaders(options?.headers),
			});
		},

		async createAndVerify(options?: RequestOptions) {
			const response = await this.signUp(options);
			if (response.statusCode !== 201) {
				throw new Error("Failed to signup");
			}

			const token = await this.getVerificationToken();
			return this.verifyAccount({ body: JSON.stringify({ token }) });
		},

		async createAndSignIn(options?: RequestOptions) {
			const response = await this.createAndVerify(options);
			if (response.statusCode !== 200) {
				throw new Error("Failed to signup and verify");
			}

			const signInResponse = await this.signIn(options);
			if (signInResponse.statusCode !== 200) {
				throw new Error("Failed to signup and verify");
			}

			const cookie = signInResponse.headers["set-cookie"];
			if (!cookie) {
				throw new Error("Cookies are empty");
			}

			const sessionCookie = (Array.isArray(cookie) ? cookie : [cookie]).find(
				(c: string) => c.startsWith(`${config.application.sessionCookieName}=`),
			);

			if (!sessionCookie) {
				throw new Error("Session is empty");
			}

			return cookie;
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
