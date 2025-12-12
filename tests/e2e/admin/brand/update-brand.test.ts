import { faker } from "@faker-js/faker";
import type { Selectable } from "kysely";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import {
	type Brand,
	type UserGender,
	UserRole,
} from "../../../../src/common/types/db.js";
import {
	BRAND_NAME_MAX_LENGTH,
	BRAND_NAME_MIN_LENGTH,
} from "../../../../src/features/admin/brand/const/index.js";
import {
	generatePassword,
	type TestApp,
	withTestApp,
} from "../../../testApp.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};

	const setup = async (app: TestApp) => {
		const session = await app.createAdminUser(signUpData);

		const getBrandsRes = await app.getAllBrands({
			headers: new Headers({
				Cookie: session,
			}),
			query: {
				limit: 2,
			},
		});

		expect(getBrandsRes.statusCode).toBe(200);

		return {
			session,
			brands: (await getBrandsRes.body.json()).data as Selectable<Brand>[],
		};
	};

	describe("Update brand", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const { session, brands } = await setup(app);

				const newName = faker.string.alpha({
					length: BRAND_NAME_MAX_LENGTH,
				});

				const res = await app.updateBrand(brands[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: JSON.stringify({
						name: newName,
					}),
				});
				expect(res.statusCode).toBe(200);
			});
		});

		it("Should save changes into database when request is successful", async () => {
			await withTestApp(async (app) => {
				const { session, brands } = await setup(app);

				const newName = faker.string.alpha({
					length: BRAND_NAME_MAX_LENGTH,
				});

				const res = await app.updateBrand(brands[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: JSON.stringify({
						name: newName,
					}),
				});
				expect(res.statusCode).toBe(200);

				const dbBrand = await app.db
					.selectFrom("brand")
					.select("name")
					.where("id", "=", brands[0].id)
					.executeTakeFirstOrThrow();

				expect(dbBrand.name).not.toBe(brands[0].name);
				expect(dbBrand.name).toBe(newName);
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
								length: BRAND_NAME_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "name is too short",
						data: {
							name: faker.string.alpha({
								length: BRAND_NAME_MIN_LENGTH - 1,
							}),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.updateBrand(faker.string.uuid(), {
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

		it("Should return 400 status code when brand already exists", async () => {
			await withTestApp(async (app) => {
				const { session, brands } = await setup(app);

				const res = await app.updateBrand(brands[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: JSON.stringify({ name: brands[1].name }),
				});

				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.updateBrand(faker.string.uuid(), {});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.updateBrand(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when brand doesn't exist", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.updateBrand(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
					body: JSON.stringify({
						name: faker.string.alpha({
							length: BRAND_NAME_MAX_LENGTH,
						}),
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});
