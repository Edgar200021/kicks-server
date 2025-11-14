import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from "../../../src/features/auth/const/zod";
import { omit, withTestApp } from "../../testApp";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	const signInData = {
		email: faker.internet.email(),
		password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
	};

	describe("Sign In", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const createAndVerifyRes = await app.createAndVerify(
					JSON.stringify(signUpData),
				);
				expect(createAndVerifyRes.statusCode).toBe(200);

				const res = await app.signIn(
					JSON.stringify(omit(signUpData, ["firstName", "lastName", "gender"])),
				);

				const data = await res.body.json();

				expect(res.statusCode).toEqual(200);
				expect(data.data).toHaveProperty("email");
				expect(data.data).toHaveProperty("firstName");
				expect(data.data).toHaveProperty("lastName");
				expect(data.data).toHaveProperty("gender");
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const testCases = [
					{ name: "empty body", data: {} },
					{
						name: "missing email",
						data: omit(signInData, "email"),
					},
					{
						name: "invalid email",
						data: { ...signInData, email: "invalid email" },
					},
					{
						name: "missing password",
						data: omit(signInData, "password"),
					},
					{
						name: "too short password",
						data: {
							...signInData,
							password: faker.internet.password({
								length: PASSWORD_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "too long password",
						data: {
							...signInData,
							password: faker.internet.password({
								length: PASSWORD_MAX_LENGTH + 1,
							}),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.signIn(JSON.stringify(data));
						const body = await res.body.json();

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
						expect(body).toBeTypeOf("object");
					}),
				);
			});
		});

		it("Should return 400 status code when user doesn't exist", async () => {
			await withTestApp(async (app) => {
				const res = await app.signIn(JSON.stringify(signInData));

				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 400 status code when user isn't verified", async () => {
			await withTestApp(async (app) => {
				const signupRes = await app.signUp(JSON.stringify(signUpData));
				expect(signupRes.statusCode).toBe(201);

				const res = await app.signIn(
					JSON.stringify(omit(signUpData, ["firstName", "lastName", "gender"])),
				);
				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 400 status code when user is banned", async () => {
			await withTestApp(async (app) => {
				const createAndVerifyRes = await app.createAndVerify(
					JSON.stringify(signUpData),
				);
				expect(createAndVerifyRes.statusCode).toBe(200);

				await app.db
					.updateTable("users")
					.where("email", "=", signUpData.email)
					.set({ isBanned: true })
					.executeTakeFirstOrThrow();

				const res = await app.signIn(
					JSON.stringify(omit(signUpData, ["firstName", "lastName", "gender"])),
				);
				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 400 status code when credentials are not correct", async () => {
			await withTestApp(async (app) => {
				const createAndVerifyRes = await app.createAndVerify(
					JSON.stringify(signUpData),
				);
				expect(createAndVerifyRes.statusCode).toBe(200);

				const res = await app.signIn(
					JSON.stringify({
						email: signUpData.email,
						password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
					}),
				);
				expect(res.statusCode).toBe(400);
			});
		});

		it("Should be rate limited", async () => {
			await withTestApp(async (testApp) => {
				await Promise.all(
					Array.from({ length: testApp.rateLimitConfig.signInLimit! }).map(
						async () => {
							const res = await testApp.signIn(
								JSON.stringify({
									email: faker.internet.email(),
									password: faker.internet.password({
										length: PASSWORD_MIN_LENGTH,
									}),
								}),
							);
							expect(res.statusCode).toBe(400);
						},
					),
				);

				const lastRes = await testApp.signIn(
					JSON.stringify({
						email: faker.internet.email(),
						password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
					}),
				);

				expect(lastRes.statusCode).toBe(429);
			});
		});
	});
});
