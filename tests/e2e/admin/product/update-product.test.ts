import {faker} from "@faker-js/faker";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {type UserGender, UserRole,} from "../../../../src/common/types/db.js";
import {
	GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
	PRODUCT_DESCRIPTION_MAX_LENGTH,
	PRODUCT_DESCRIPTION_MIN_LENGTH,
	PRODUCT_TITLE_MAX_LENGTH,
	PRODUCT_TITLE_MIN_LENGTH,
} from "../../../../src/features/admin/product/const/zod.js";
import {generatePassword, type TestApp, withTestApp,} from "../../../testApp.js";
import {AdminProduct} from "../../../../src/features/admin/product/types/db.js";

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

		const res = await app.getAllAdminProducts({
			headers: new Headers({
				Cookie: session,
			}),
			query: {
				limit: GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
			},
		});
		expect(res.statusCode).toBe(200);

		return {
			session,
			products: (
				(await res.body.json()) as {
					data: {
						products: AdminProduct[];
					};
				}
			).data.products,
		};
	};

	describe("Update Product", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, products} = await setup(app);
				const newTitle = faker.string.alpha({
					length: PRODUCT_TITLE_MAX_LENGTH,
				});

				const res = await app.updateProduct(products[0].id, {
					body: JSON.stringify({
						title: newTitle,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);
			});
		});

		it("Should apply changes into database when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, products} = await setup(app);

				const newTitle = faker.string.alpha({
					length: PRODUCT_TITLE_MAX_LENGTH,
				});
				const newDescription = faker.string.alpha({
					length: PRODUCT_DESCRIPTION_MAX_LENGTH,
				});


				const res = await app.updateProduct(products[0].id, {
					body: JSON.stringify({
						title: newTitle,
						description: newDescription,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);

				const dbProduct = await app.db
					.selectFrom("product")
					.select(["id", "title", "description"])
					.where("id", "=", products[0].id)
					.executeTakeFirst();

				expect(dbProduct).toBeDefined();
				expect(dbProduct!.title).not.equal(products[0].title);
				expect(dbProduct!.title).equal(newTitle);
				expect(dbProduct!.description).not.equal(products[0].description);
				expect(dbProduct!.description).equal(newDescription);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const {session, products} = await setup(app);

				const testCases = [
					{
						name: "title is too short",
						data: {
							title: faker.string.alpha({
								length: PRODUCT_TITLE_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "title is too long",
						data: {
							title: faker.string.alpha({
								length: PRODUCT_TITLE_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "description is too short",
						data: {
							description: faker.string.alpha({
								length: PRODUCT_DESCRIPTION_MIN_LENGTH - 1,
							}),
						},
					},
					{
						name: "description is too long",
						data: {
							description: faker.string.alpha({
								length: PRODUCT_DESCRIPTION_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "invalid gender",
						data: {gender: "invalid gender"},
					},
					{
						name: "categoryId is not uuid",
						data: {categoryId: "invalid id"},
					},
					{
						name: "brandId is not uuid",
						data: {brandId: "invalid id"},
					},
				];

				for (const {name, data} of testCases) {
					const res = await app.updateProduct(products[0].id, {
						headers: new Headers({
							Cookie: session,
						}),
						body: JSON.stringify(data),
					});

					expect(res.statusCode, `${name} → wrong status`).toBe(400);
				}
			});
		});

		it("Should return 400 status code when product already exists", async () => {
			await withTestApp(async (app) => {
				const {session, products} = await setup(app);

				for (const product of products) {
					const sameProduct = await app.db
						.selectFrom("product")
						.selectAll()
						.where((eb) =>
							eb.and([
								eb("brandId", "=", product.brand?.id ?? null),
								eb("categoryId", "=", product.category?.id ?? null),
								eb("title", "=", product.title),
								eb("id", "!=", product.id),
							]),
						)
						.executeTakeFirst();

					if (!sameProduct) continue;

					const res = await app.updateProduct(product.id, {
						body: JSON.stringify({
							gender: sameProduct.gender,
						}),
						headers: new Headers({
							Cookie: session,
						}),
					});

					expect(res.statusCode).toBe(400);
					break;
				}
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.updateProduct(faker.string.uuid());

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.updateProduct(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when product, category or brand doesn't exist", async () => {
			await withTestApp(async (app) => {
				const {session, products} = await setup(app);

				const testCases = [
					{
						name: "product not found",
						data: {categoryId: faker.string.uuid()},
						productId: faker.string.uuid(),
					},
					{
						name: "category not found",
						data: {categoryId: faker.string.uuid()},
						productId: products[0].id,
					},
					{
						name: "brand not found",
						data: {brandId: faker.string.uuid()},
						productId: products[0].id,
					},
				];

				for (const {name, data, productId} of testCases) {
					const res = await app.updateProduct(productId, {
						headers: new Headers({
							Cookie: session,
						}),
						body: JSON.stringify(data),
					});

					expect(res.statusCode, `${name} → wrong status`).toBe(404);
				}
			});
		});
	});
});