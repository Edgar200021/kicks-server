import {randomUUID} from "node:crypto";
import {RedisContainer} from "@testcontainers/redis";
import {Redis} from "ioredis";
import type {Selectable} from "kysely";
import {type Dispatcher, FormData, Headers, request} from "undici";
import type {UndiciHeaders} from "undici/types/dispatcher.js";
import {buildApp} from "../src/app.js";
import {v2 as cloudinary,} from "cloudinary";

import {
	RESET_PASSWORD_PREFIX,
	SESSION_PREFIX,
	VERIFICATION_PREFIX,
} from "../src/common/const/index.js";
import {
	type Brand,
	type Category,
	type Product,
	ProductSku,
	UserRole,
	type Users,
} from "../src/common/types/db.js";
import {deepFreeze} from "../src/common/utils/index.js";
import {setupConfig} from "../src/config/config.js";
import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH,} from "../src/features/auth/const/zod.js";
import type {SignUpRequest} from "../src/features/auth/schemas/sign-up.schema.js";
import {setupTestDb} from "./setupTestDb.js";
import path from "node:path";
import fs from "node:fs";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SPECIALS = "!@#$%^&*";

export const generatePassword = () => {
	const length =
		Math.floor(
			Math.random() * (PASSWORD_MAX_LENGTH - PASSWORD_MIN_LENGTH + 1),
		) + PASSWORD_MIN_LENGTH;

	const chars = [
		UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)],
		LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)],
		DIGITS[Math.floor(Math.random() * DIGITS.length)],
		SPECIALS[Math.floor(Math.random() * SPECIALS.length)],
	];

	const allChars = UPPERCASE + LOWERCASE + DIGITS + SPECIALS;
	while (chars.length < length) {
		chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
	}

	for (let i = chars.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[chars[i], chars[j]] = [chars[j], chars[i]];
	}

	return chars.join("");
};


export type TestApp = Awaited<ReturnType<typeof createTestApp>>;
type RequestOptions = Partial<Omit<Dispatcher.RequestOptions, "method">>;

const buildHeaders = (headers?: UndiciHeaders, json: boolean = true) => {
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
		new Headers(json ? {"Content-Type": "application/json"} : {}),
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

export const buildFormData = (data: Record<string, number | string | File
	| (string | number | File)[]>): FormData => {
	return Object.entries(data).reduce((form, [key, value]) => {
		if (Array.isArray(value)) {
			for (const val of value) {
				form.append(key, val)
			}

			return form
		}

		form.append(key, value)
		return form
	}, new FormData())
}

export const buildFile = (data: { format: "pdf" } | { "format": "image", big: boolean } = {
	format: "image",
	big: false
}) => {
	const fileName = data.format === "pdf" ? "sample.pdf" : data.big ? "8k.jpg" : "mountain.jpg"
	const type = data.format === "pdf" ? "application/pdf" : "image/jpeg"

	return new File([fs.readFileSync(path.join(__dirname, "assets", fileName))], fileName, {type})
}


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
	config.rateLimit.resetPasswordLimit = 10;

	deepFreeze(config);

	const {removeDb, db} = await setupTestDb(config.database);
	const redis = new Redis({
		host: config.redis.host,
		port: config.redis.port,
		password: config.redis.password,
	});
	const app = await buildApp(config)

	cloudinary.config({
		cloud_name: config.cloudinary.cloudName,
		api_key: config.cloudinary.apiKey,
		api_secret: config.cloudinary.apiSecret,
	});

	const address = await app.listen({port: 0, host: "127.0.0.1"});

	return {
		async close() {
			await app.close();
			await Promise.all([db.destroy(), redis.quit(), cloudinary.api.delete_all_resources()]);
			await Promise.all([
				redisContainer.stop({remove: true, removeVolumes: true}),
				removeDb(),
			]);
		},
		db,
		rateLimitConfig: config.rateLimit,
		applicationConfig: config.application,

		async getRedisToken(type: "verification" | "reset-password" | "session") {
			const key =
				type === "verification"
					? VERIFICATION_PREFIX
					: type === "reset-password"
						? RESET_PASSWORD_PREFIX
						: SESSION_PREFIX;

			return (await redis.keys("*"))
				.filter((key) => key.startsWith(key))
				.at(-1)
				?.split(key)
				.at(-1);
		},

		async deleteResetPasswordToken() {
			const token = await this.getRedisToken("reset-password");
			if (!token) return;

			await redis.del(`${RESET_PASSWORD_PREFIX}${token}`);
		},

		async signUp(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/sign-up`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
			});
		},

		async signIn(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/sign-in`, {
				...options,
				method: "POST",
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

		async logout(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/logout`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
				body: JSON.stringify({}),
			});
		},

		async createAndVerify(options?: RequestOptions) {
			const response = await this.signUp(options);
			if (response.statusCode !== 201) {
				throw new Error("Failed to signup");
			}

			const token = await this.getRedisToken("verification");
			return this.verifyAccount({body: JSON.stringify({token})});
		},

		async createAndSignIn(options?: RequestOptions): Promise<string> {
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

			return sessionCookie;
		},

		async createAdminUser(body: SignUpRequest) {
			const session = await this.createAndSignIn({
				body: JSON.stringify(body),
			});
			await db
				.updateTable("users")
				.set({role: UserRole.Admin})
				.where("email", "=", body.email)
				.executeTakeFirstOrThrow();

			return session;
		},

		async forgotPassword(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/forgot-password`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
			});
		},

		async resetPassword(options?: RequestOptions) {
			return request(`${address}/api/v1/auth/reset-password`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
			});
		},

		//Admin routes

		async getAllUsers(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/user`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async blockToggle(
			userId: Selectable<Users>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/user/${userId}/block-toggle`, {
				...options,
				method: "PATCH",
				body: JSON.stringify({}),
				headers: buildHeaders(options?.headers),
			});
		},

		async removeUser(
			userId: Selectable<Users>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/user/${userId}`, {
				...options,
				method: "DELETE",
				body: JSON.stringify({}),
				headers: buildHeaders(options?.headers),
			});
		},

		async getAllCategories(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/category`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async createCategory(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/category`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
			});
		},

		async updateCategory(
			categoryId: Selectable<Category>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/category/${categoryId}`, {
				...options,
				method: "PATCH",
				headers: buildHeaders(options?.headers),
			});
		},

		async removeCategory(
			categoryId: Selectable<Category>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/category/${categoryId}`, {
				...options,
				method: "DELETE",
				body: JSON.stringify({}),
				headers: buildHeaders(options?.headers),
			});
		},

		async getAllBrands(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/brand`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async createBrand(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/brand`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
			});
		},

		async updateBrand(
			brandId: Selectable<Brand>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/brand/${brandId}`, {
				...options,
				method: "PATCH",
				headers: buildHeaders(options?.headers),
			});
		},

		async removeBrand(
			brandId: Selectable<Brand>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/brand/${brandId}`, {
				...options,
				method: "DELETE",
				body: JSON.stringify({}),
				headers: buildHeaders(options?.headers),
			});
		},

		async getAllAdminProducts(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/product`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async getAdminProduct(
			id: Selectable<Product>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/product/${id}`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async getProductFilters(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/product/filters`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async createProduct(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/product`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers),
			});
		},

		async updateProduct(
			id: Selectable<Product>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/product/${id}`, {
				...options,
				method: "PATCH",
				headers: buildHeaders(options?.headers),
			});
		},

		async removeProduct(
			id: Selectable<Product>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/product/${id}`, {
				...options,
				method: "DELETE",
				body: JSON.stringify({}),
				headers: buildHeaders(options?.headers),
			});
		},

		async getAllAdminProductsSku(options?: RequestOptions) {
			return request(`${address}/api/v1/admin/product/sku`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async getAdminProductSku(
			id: Selectable<ProductSku>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/product/sku/${id}`, {
				...options,
				method: "GET",
				headers: buildHeaders(options?.headers),
			});
		},

		async createProductSku(id: Selectable<Product>["id"], options?: RequestOptions) {
			return request(`${address}/api/v1/admin/product/${id}/sku`, {
				...options,
				method: "POST",
				headers: buildHeaders(options?.headers, false),
			});
		},

		async updateProductSku(
			id: Selectable<ProductSku>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/product/sku/${id}`, {
				...options,
				method: "PATCH",
				headers: buildHeaders(options?.headers, false),
			});
		},

		async removeProductSku(
			id: Selectable<Product>["id"],
			options?: RequestOptions,
		) {
			return request(`${address}/api/v1/admin/product/sku/${id}`, {
				...options,
				method: "DELETE",
				body: JSON.stringify({}),
				headers: buildHeaders(options?.headers),
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