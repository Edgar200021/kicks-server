import {faker} from "@faker-js/faker";
import type {Selectable} from "kysely";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {
	type Brand,
	type Category,
	type Product,
	type UserGender,
	UserRole,
} from "../../../../src/common/types/db.js";

import {generatePassword, type TestApp, withTestApp,} from "../../../testApp.js";

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
				limit: 1,
			},
		});
		expect(res.statusCode).toBe(200);

		return {
			session,
			product: (
				(await res.body.json()) as {
					data: {
						products: (Selectable<Product> & {
							category: Pick<Selectable<Category>, "id" | "name"> | null;
							brand: Pick<Selectable<Brand>, "id" | "name"> | null;
						})[];
					};
				}
			).data.products[0],
		};
	};

	describe("Remove product", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, product} = await setup(app);

				const res = await app.removeProduct(product.id, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);
			});
		});

		it("Should be deleted from database when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, product} = await setup(app);

				const res = await app.removeProduct(product.id, {
					headers: new Headers({
						Cookie: session,
					}),
				});
				expect(res.statusCode).toBe(200);

				const dbProduct = await app.db
					.selectFrom("product")
					.where("id", "=", product.id)
					.executeTakeFirst();

				expect(dbProduct).toBeUndefined();
			});
		});

		it("Should return 400 status code when productId is invalid", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const testCases = [
					{
						name: "id is number",
						id: 12341,
					},
					{
						name: "non uuid",
						id: "someid",
					},
				];

				await Promise.all(
					testCases.map(async ({name, id}) => {
						const res = await app.removeProduct(id as string, {
							headers: new Headers({
								Cookie: session,
							}),
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
					}),
				);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.removeProduct(faker.string.uuid());

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.removeProduct(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when product doesn't exist", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.removeProduct(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});