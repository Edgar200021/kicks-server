import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { type UserGender, UserRole } from "../../../../src/common/types/db.js";
import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MIN_LENGTH,
} from "../../../../src/features/admin/category/const/index.js";
import { generatePassword, withTestApp } from "../../../testApp.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};

	describe("Create category", () => {
		it("Should return 201 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.createCategory({
					headers: new Headers({
						Cookie: session,
					}),
					body: JSON.stringify({
						name: faker.string.alpha({ length: CATEGORY_NAME_MAX_LENGTH }),
					}),
				});

				const data = await res.body.json();

				expect(res.statusCode).toBe(201);
				expect(data.data).toBeTypeOf("object");
				expect(data.data).toHaveProperty("id");
				expect(data.data).toHaveProperty("name");
				expect(data.data).toHaveProperty("createdAt");
				expect(data.data).toHaveProperty("updatedAt");
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const testCases = [
					{
						name: "empty body",
						data: {},
					},
					{
						name: "name is too long",
						data: {
							name: faker.string.alpha({
								length: CATEGORY_NAME_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "name is too short",
						data: {
							name: faker.string.alpha({
								length: CATEGORY_NAME_MIN_LENGTH - 1,
							}),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.createCategory({
							headers: new Headers({
								Cookie: session,
							}),
							body: JSON.stringify(data),
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
					}),
				);
			});
		});

		it("Should return 400 status code when category already exists", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const body = JSON.stringify({
					name: faker.string.alpha({ length: CATEGORY_NAME_MAX_LENGTH }),
				});

				const res = await app.createCategory({
					headers: new Headers({
						Cookie: session,
					}),
					body,
				});

				expect(res.statusCode).toBe(201);

				const secondRes = await app.createCategory({
					headers: new Headers({
						Cookie: session,
					}),
					body,
				});

				expect(secondRes.statusCode).toBe(400);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.createCategory({});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.createCategory({
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});
	});
});
