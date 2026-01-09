import {faker} from "@faker-js/faker";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {type UserGender, UserRole,} from "../../../../src/common/types/db.js";

import {generatePassword, type TestApp, withTestApp,} from "../../../testApp.js";
import {AdminProductSku} from "../../../../src/features/admin/product/types/db.js";

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

		const res = await app.getAllAdminProductsSku({
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
			productSku: (
				(await res.body.json()) as {
					data: {
						productsSku: AdminProductSku[];
					};
				}
			).data.productsSku[0],
		};
	};

	describe("Remove product Sku", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, productSku} = await setup(app);

				const res = await app.removeProductSku(productSku.id, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);
			});
		});

		it("Should apply changes into database when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, productSku} = await setup(app);

				const res = await app.removeProductSku(productSku.id, {
					headers: new Headers({
						Cookie: session,
					}),
				});
				expect(res.statusCode).toBe(200);

				const dbProductSku = await app.db
					.selectFrom("productSku")
					.where("id", "=", productSku.id)
					.executeTakeFirst();

				expect(dbProductSku).toBeUndefined()
			});
		});

		it("Should return 400 status code when product sku Id is invalid", async () => {
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
						const res = await app.removeProductSku(id as string, {
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
				const res = await app.removeProductSku(faker.string.uuid());

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.removeProductSku(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when product sku doesn't exist", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.removeProductSku(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});