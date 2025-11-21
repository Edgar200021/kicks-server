import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { generatePassword, omit, withTestApp } from "../../testApp.js";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	describe("Reset Password", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const createRes = await app.createAndVerify({
					body: JSON.stringify(signUpData),
				});
				expect(createRes.statusCode).toBe(200);

				const forgotRes = await app.forgotPassword({
					body: JSON.stringify(
						omit(signUpData, ["firstName", "lastName", "gender", "password"]),
					),
				});
				expect(forgotRes.statusCode).toEqual(200);

				const token = await app.getResetPasswordToken();
				const res = await app.resetPassword({
					body: JSON.stringify({
						email: signUpData.email,
						token,
						password: generatePassword(),
					}),
				});

				expect(res.statusCode).toBe(200);
			});
		});

		it("Should apply changes in database when request is successful", async () => {
			await withTestApp(async (app) => {
				const createRes = await app.createAndVerify({
					body: JSON.stringify(signUpData),
				});
				expect(createRes.statusCode).toBe(200);

				const forgotRes = await app.forgotPassword({
					body: JSON.stringify(
						omit(signUpData, ["firstName", "lastName", "gender", "password"]),
					),
				});
				expect(forgotRes.statusCode).toEqual(200);

				const token = await app.getResetPasswordToken();
				const password = generatePassword();

				const res = await app.resetPassword({
					body: JSON.stringify({
						email: signUpData.email,
						token,
						password,
					}),
				});

				expect(res.statusCode).toBe(200);

				const dbUser = await app.db
					.selectFrom("users")
					.selectAll()
					.where("email", "=", signUpData.email)
					.executeTakeFirst();

				expect(dbUser).toBeDefined();
				expect(dbUser?.password).not.equal(signUpData.password);
				expect(dbUser?.password).not.equal(password);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const data = {
					email: faker.internet.email(),
					password: generatePassword(),
					token: faker.string.sample(),
				};

				const testCases = [
					{
						name: "empty body",
						data: {},
					},
					{
						name: "invalid email",
						data: {
							email: "invalid email",
						},
					},
					{
						name: "empty email",
						data: omit(data, "email"),
					},
					{
						name: "empty password",
						data: omit(data, "password"),
					},
					{
						name: "empty token",
						data: omit(data, "token"),
					},
					{
						name: "not strong password",
						data: { ...data, password: "sample password" },
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.resetPassword({ body: JSON.stringify(data) });
						const body = await res.body.json();

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
						expect(body).toBeTypeOf("object");
					}),
				);
			});
		});

		it("Should return 400 status code when token is deleted from redis, or user is deleted from database, or email !== user email", async () => {
			await withTestApp(async (app) => {
				const createRes = await app.createAndVerify({
					body: JSON.stringify(signUpData),
				});
				expect(createRes.statusCode).toBe(200);

				const forgotRes = await app.forgotPassword({
					body: JSON.stringify(
						omit(signUpData, ["firstName", "lastName", "gender", "password"]),
					),
				});
				expect(forgotRes.statusCode).toEqual(200);

				const token = await app.getResetPasswordToken();

				for (let i = 0; i < 3; i++) {
					if (i === 1) {
						await app.db
							.deleteFrom("users")
							.where("email", "=", signUpData.email)
							.executeTakeFirstOrThrow();
					}

					if (i === 2) {
						await app.deleteResetPasswordToken();
					}

					const res = await app.resetPassword({
						body: JSON.stringify({
							email: i === 0 ? faker.internet.email() : signUpData.email,
							token,
							password: generatePassword(),
						}),
					});

					expect(res.statusCode).toBe(400);
				}
			});
		});

		it("Should be rate limited", async () => {
			await withTestApp(async (testApp) => {
				await Promise.all(
					Array.from({
						// biome-ignore lint:has default value
						length: testApp.rateLimitConfig.resetPasswordLimit!,
					}).map(async () => {
						const res = await testApp.resetPassword({
							body: JSON.stringify({
								email: faker.internet.email(),
								password: generatePassword(),
							}),
						});
						expect(res.statusCode).toBe(400);
					}),
				);

				const lastRes = await testApp.resetPassword({
					body: JSON.stringify({
						email: faker.internet.email(),
						password: generatePassword(),
					}),
				});

				expect(lastRes.statusCode).toBe(429);
			});
		});
	});
});
