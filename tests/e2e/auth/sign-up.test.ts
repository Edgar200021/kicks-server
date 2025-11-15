import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import {
	FIRST_NAME_MAX_LENGTH,
	FIRST_NAME_MIN_LENGTH,
	LAST_NAME_MAX_LENGTH,
	LAST_NAME_MIN_LENGTH,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from "../../../src/features/auth/const/index.js";
import { omit, withTestApp } from "../../testApp.js";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	describe("Sign Up", () => {
		it("Should return 201 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const res = await app.signUp({ body: JSON.stringify(signUpData) });

				const data = await res.body.json();

				expect(res.statusCode).toEqual(201);
				expect(data.data).toBeNull();
			});
		});

		it("Should be saved in database when request is successful", async () => {
			await withTestApp(async (app) => {
				const res = await app.signUp({ body: JSON.stringify(signUpData) });

				expect(res.statusCode).toEqual(201);

				const dbUser = await app.db
					.selectFrom("users")
					.selectAll()
					.where("email", "=", signUpData.email)
					.executeTakeFirst();

				expect(dbUser).toBeDefined();
				expect(dbUser?.password).not.equal(signUpData.password);
			});
		});

		it("Should return 400 status code when user already exists", async () => {
			await withTestApp(async (app) => {
				const res = await app.signUp({ body: JSON.stringify(signUpData) });

				expect(res.statusCode).toEqual(201);

				const secondRes = await app.signUp({
					body: JSON.stringify(signUpData),
				});
				const body = await secondRes.body.json();

				expect(secondRes.statusCode).toEqual(400);
				expect(body).toHaveProperty("error");
			});
		});

		it("Should return 400 status code when request data is invalid", async () => {
			await withTestApp(async (app) => {
				const testCases = [
					{ name: "empty body", data: {} },
					{
						name: "missing email",
						data: omit(signUpData, "email"),
					},
					{
						name: "invalid email",
						data: { ...signUpData, email: "invalid email" },
					},
					{
						name: "missing password",
						data: omit(signUpData, "password"),
					},
					{
						name: "too short password",
						data: {
							...signUpData,
							password: faker.internet.password({
								length: PASSWORD_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "too long password",
						data: {
							...signUpData,
							password: faker.internet.password({
								length: PASSWORD_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "missing first name",
						data: omit(signUpData, "firstName"),
					},
					{
						name: "too short first name",
						data: {
							...signUpData,
							firstName: faker.string.alpha({
								length: FIRST_NAME_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "too long first name",
						data: {
							...signUpData,
							firstName: faker.string.alpha({
								length: FIRST_NAME_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "missing last name",
						data: omit(signUpData, "lastName"),
					},
					{
						name: "too short last name",
						data: {
							...signUpData,
							firstName: faker.string.alpha({
								length: LAST_NAME_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "too long last name",
						data: {
							...signUpData,
							firstName: faker.string.alpha({
								length: LAST_NAME_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "missing gender",
						data: omit(signUpData, "gender"),
					},
					{
						name: "invalid gender",
						data: {
							...signUpData,
							gender: faker.string.sample(),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.signUp({ body: JSON.stringify(data) });
						const body = await res.body.json();

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
						expect(body).toBeTypeOf("object");
					}),
				);
			});
		});

		it("Should be rate limited", async () => {
			await withTestApp(async (testApp) => {
				await Promise.all(
					Array.from({ length: testApp.rateLimitConfig.signUpLimit! }).map(
						async () => {
							const res = await testApp.signUp({
								body: JSON.stringify({
									email: faker.internet.email(),
									password: faker.internet.password({
										length: PASSWORD_MIN_LENGTH,
									}),
									firstName: faker.person.firstName(),
									lastName: faker.person.lastName(),
									gender: faker.person.sexType(),
								}),
							});
							expect(res.statusCode).toBe(201);
						},
					),
				);

				const lastRes = await testApp.signUp({
					body: JSON.stringify({
						email: faker.internet.email(),
						password: faker.internet.password({ length: PASSWORD_MIN_LENGTH }),
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
						gender: faker.person.sexType(),
					}),
				});

				expect(lastRes.statusCode).toBe(429);
			});
		});
	});
});
