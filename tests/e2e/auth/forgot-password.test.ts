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

	describe("Forgot Password", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const createRes = await app.createAndVerify({
					body: JSON.stringify(signUpData),
				});
				expect(createRes.statusCode).toBe(200);

				const res = await app.forgotPassword({
					body: JSON.stringify(
						omit(signUpData, ["firstName", "lastName", "gender", "password"]),
					),
				});

				expect(res.statusCode).toEqual(200);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
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
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.forgotPassword({
							body: JSON.stringify(data),
						});
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
					Array.from({
						// biome-ignore lint:has default value
						length: testApp.rateLimitConfig.forgotPasswordLimit!,
					}).map(async () => {
						const res = await testApp.forgotPassword({
							body: JSON.stringify({
								email: faker.internet.email(),
								password: generatePassword(),
							}),
						});
						expect(res.statusCode).toBe(404);
					}),
				);

				const lastRes = await testApp.forgotPassword({
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
