import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import {
	ProductGender,
	type UserGender,
	UserRole,
} from "../../../../src/common/types/db.js";
import {
	PRODUCT_DESCRIPTION_MAX_LENGTH,
	PRODUCT_DESCRIPTION_MIN_LENGTH,
	PRODUCT_TITLE_MAX_LENGTH,
	PRODUCT_TITLE_MIN_LENGTH,
} from "../../../../src/features/admin/product/const/zod.js";
import {
	generatePassword,
	omit,
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

		const res = await app.getProductFilters({
			headers: new Headers({
				Cookie: session,
			}),
		});

		expect(res.statusCode).toBe(200);
		return {
			session,
			filters: (
				(await res.body.json()) as {
					data: {
						categories: { id: string; name: string }[];
						brands: { id: string; name: string }[];
					};
				}
			).data,
		};
	};

	describe("Create Product", () => {
		it("Should return 201 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const { session, filters } = await setup(app);

				const res = await app.createProduct({
					body: JSON.stringify({
						title: faker.string.alpha({ length: PRODUCT_TITLE_MAX_LENGTH }),
						description: faker.string.alpha({
							length: PRODUCT_DESCRIPTION_MAX_LENGTH,
						}),
						gender: ProductGender.Men,
						categoryId: filters.categories[0].id,
						brandId: filters.brands[0].id,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(201);
			});
		});

		it("Should be saved into database when request is successful", async () => {
			await withTestApp(async (app) => {
				const { session, filters } = await setup(app);

				const res = await app.createProduct({
					body: JSON.stringify({
						title: faker.string.alpha({ length: PRODUCT_TITLE_MAX_LENGTH }),
						description: faker.string.alpha({
							length: PRODUCT_DESCRIPTION_MAX_LENGTH,
						}),
						gender: ProductGender.Men,
						categoryId: filters.categories[0].id,
						brandId: filters.brands[0].id,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(201);

				const {
					data: { id },
				} = (await res.body.json()) as { data: { id: string } };

				const dbProduct = await app.db
					.selectFrom("product")
					.select("id")
					.where("id", "=", id)
					.executeTakeFirstOrThrow();

				expect(dbProduct).toBeDefined();
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const { session, filters } = await setup(app);

				const product = {
					title: faker.string.alpha({ length: PRODUCT_TITLE_MAX_LENGTH }),
					description: faker.string.alpha({
						length: PRODUCT_DESCRIPTION_MAX_LENGTH,
					}),
					gender: ProductGender.Men,
					categoryId: filters.categories[0].id,
					brandId: filters.brands[0].id,
				};

				const testCases = [
					{
						name: "title is missing",
						data: omit(product, "title"),
					},
					{
						name: "title is too short",
						data: {
							...product,
							title: faker.string.alpha({
								length: PRODUCT_TITLE_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "title is too long",
						data: {
							...product,
							title: faker.string.alpha({
								length: PRODUCT_TITLE_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "description is missing",
						data: omit(product, "description"),
					},
					{
						name: "description is too short",
						data: {
							...product,
							description: faker.string.alpha({
								length: PRODUCT_DESCRIPTION_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "description is too long",
						data: {
							...product,
							description: faker.string.alpha({
								length: PRODUCT_DESCRIPTION_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "tag is empty array",
						data: { ...product, tags: [""] },
					},
					{
						name: "invalid gender",
						data: { ...product, gender: "invalid gender" },
					},
					{
						name: "categoryId is missing",
						data: omit(product, "categoryId"),
					},
					{
						name: "categoryId is not uuid",
						data: { ...product, categoryId: "invalid id" },
					},
					{
						name: "brandId is missing",
						data: omit(product, "brandId"),
					},
					{
						name: "brandId is not uuid",
						data: { ...product, brandId: "invalid id" },
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.createProduct({
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

		it("Should return 400 status code when product already exists", async () => {
			await withTestApp(async (app) => {
				const { session, filters } = await setup(app);

				const res = await app.createProduct({
					body: JSON.stringify({
						title: faker.string.alpha({ length: PRODUCT_TITLE_MAX_LENGTH }),
						description: faker.string.alpha({
							length: PRODUCT_DESCRIPTION_MAX_LENGTH,
						}),
						gender: ProductGender.Men,
						categoryId: filters.categories[0].id,
						brandId: filters.brands[0].id,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(201);

				const {
					data: { id },
				} = (await res.body.json()) as { data: { id: string } };

				const dbProduct = await app.db
					.selectFrom("product")
					.select(["title"])
					.where("id", "=", id)
					.executeTakeFirstOrThrow();

				expect(dbProduct).toBeDefined();

				const secondRes = await app.createProduct({
					body: JSON.stringify({
						title: dbProduct.title,
						description: faker.string.alpha({
							length: PRODUCT_DESCRIPTION_MAX_LENGTH,
						}),
						gender: ProductGender.Men,
						categoryId: filters.categories[0].id,
						brandId: filters.brands[0].id,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(secondRes.statusCode).toBe(400);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.createProduct({});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.createProduct({
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when category or brand doesn't exist", async () => {
			await withTestApp(async (app) => {
				const { session, filters } = await setup(app);

				const product = {
					title: faker.string.alpha({ length: PRODUCT_TITLE_MAX_LENGTH }),
					description: faker.string.alpha({
						length: PRODUCT_DESCRIPTION_MAX_LENGTH,
					}),
					gender: ProductGender.Men,
					categoryId: filters.categories[0].id,
					brandId: filters.brands[0].id,
				};

				const testCases = [
					{
						name: "category not found",
						data: { ...product, categoryId: faker.string.uuid() },
					},
					{
						name: "brand not found",
						data: { ...product, brandId: faker.string.uuid() },
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.createProduct({
							headers: new Headers({
								Cookie: session,
							}),
							body: JSON.stringify(data),
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(404);
					}),
				);
			});
		});
	});
});
