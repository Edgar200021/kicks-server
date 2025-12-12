import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { type UserGender, UserRole } from "../../../../src/common/types/db.js";
import { generatePassword, withTestApp } from "../../../testApp.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};

	describe("Get Product Filters", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.getProductFilters({
					headers: new Headers({
						Cookie: session,
					}),
				});

				const data = await res.body.json();

				expect(res.statusCode).toBe(200);
				expect(data.data).toHaveProperty("tags");
				expect(data.data).toHaveProperty("categories");
				expect(data.data).toHaveProperty("brands");

				expect(data.data.categories[0]).toHaveProperty("id");
				expect(data.data.categories[0]).toHaveProperty("name");

				expect(data.data.brands[0]).toHaveProperty("id");
				expect(data.data.brands[0]).toHaveProperty("name");
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.getProductFilters({});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.getProductFilters({
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});
	});
});
