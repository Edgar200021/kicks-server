import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import {
	PASSWORD_MIN_LENGTH,
	VERIFICATION_TOKEN_MAX_LENGTH,
} from "../../../src/features/auth/const/index.js";
import { withTestApp } from "../../testApp.js";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	describe("Verify Account", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const signupRes = await app.signUp({
					body: JSON.stringify(signUpData),
				});
				expect(signupRes.statusCode).toBe(201);

				const token = await app.getVerificationToken();

				const verifyRes = await app.verifyAccount({
					body: JSON.stringify({ token }),
				});
				expect(verifyRes.statusCode).toBe(200);
			});
		});

		it("Should update column isVerified to true when request is successful", async () => {
			await withTestApp(async (app) => {
				const signupRes = await app.signUp({
					body: JSON.stringify(signUpData),
				});
				expect(signupRes.statusCode).toBe(201);

				const token = await app.getVerificationToken();

				const verifyRes = await app.verifyAccount({
					body: JSON.stringify({ token }),
				});
				expect(verifyRes.statusCode).toBe(200);

				const { isVerified } = await app.db
					.selectFrom("users")
					.select("isVerified")
					.where("email", "=", signUpData.email)
					.executeTakeFirstOrThrow();

				expect(isVerified).toBe(true);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const testCases = [
					{ name: "empty body", data: {} },
					{
						name: "too long token",
						data: {
							token: faker.string.alpha({
								length: VERIFICATION_TOKEN_MAX_LENGTH + 1,
							}),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.verifyAccount({ body: JSON.stringify(data) });
						const body = await res.body.json();

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
						expect(body).toBeTypeOf("object");
					}),
				);
			});
		});

		it("Should return 400 status code when token not found", async () => {
			await withTestApp(async (app) => {
				const res = await app.verifyAccount({
					body: JSON.stringify({ token: faker.string.sample() }),
				});

				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 400 status code when user is already verified", async () => {
			await withTestApp(async (app) => {
				const signupRes = await app.signUp({
					body: JSON.stringify(signUpData),
				});
				expect(signupRes.statusCode).toBe(201);

				const token = await app.getVerificationToken();

				const verifyRes = await app.verifyAccount({
					body: JSON.stringify({ token }),
				});
				expect(verifyRes.statusCode).toBe(200);

				const secondVerifyRes = await app.verifyAccount({
					body: JSON.stringify({ token }),
				});
				expect(secondVerifyRes.statusCode).toBe(400);
			});
		});

		it("Should return 400 status code when user is banned", async () => {
			await withTestApp(async (app) => {
				const signupRes = await app.signUp({
					body: JSON.stringify(signUpData),
				});
				expect(signupRes.statusCode).toBe(201);

				const token = await app.getVerificationToken();

				await app.db
					.updateTable("users")
					.set("isBanned", true)
					.where("email", "=", signUpData.email)
					.executeTakeFirstOrThrow();

				const verifyRes = await app.verifyAccount({
					body: JSON.stringify({ token }),
				});
				expect(verifyRes.statusCode).toBe(400);
			});
		});

		it("Should return 400 status code when user doesn't exist", async () => {
			await withTestApp(async (app) => {
				const signupRes = await app.signUp({
					body: JSON.stringify(signUpData),
				});
				expect(signupRes.statusCode).toBe(201);

				const token = await app.getVerificationToken();

				await app.db
					.deleteFrom("users")
					.where("email", "=", signUpData.email)
					.executeTakeFirstOrThrow();

				const verifyRes = await app.verifyAccount({
					body: JSON.stringify({ token }),
				});
				expect(verifyRes.statusCode).toBe(404);
			});
		});

		it("Should be rate limited", async () => {
			await withTestApp(async (testApp) => {
				await Promise.all(
					Array.from({
						length: testApp.rateLimitConfig.accountVerificationLimit!,
					}).map(async () => {
						const res = await testApp.verifyAccount({
							body: JSON.stringify({
								token: "Some token",
							}),
						});
						expect(res.statusCode).toBe(400);
					}),
				);

				const lastRes = await testApp.verifyAccount({
					body: JSON.stringify({
						token: "Some token",
					}),
				});

				expect(lastRes.statusCode).toBe(429);
			});
		});
	});
});
