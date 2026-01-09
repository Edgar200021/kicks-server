import {faker} from "@faker-js/faker";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {type UserGender, UserRole,} from "../../../../src/common/types/db.js";
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
				limit: 1,
			},
		});
		expect(res.statusCode).toBe(200);

		return {
			session,
			product: (
				(await res.body.json()) as {
					data: {
						products: AdminProduct[];
					};
				}
			).data.products[0],
		};
	};

	describe("Get Admin Product", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, product: pr} = await setup(app);

				const res = await app.getAdminProduct(pr.id, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				const data = await res.body.json();
				expect(data).toHaveProperty("data");

				const product = data.data;

				expect(res.statusCode).toBe(200);
				expect(product).toHaveProperty("id");
				expect(product).toHaveProperty("createdAt");
				expect(product).toHaveProperty("updatedAt");
				expect(product).toHaveProperty("title");
				expect(product).toHaveProperty("description");
				expect(product).toHaveProperty("gender");
				expect(product).toHaveProperty("tags");
				expect(product.tags).toBeInstanceOf(Array);
				expect(product).toHaveProperty("isDeleted");

				expect(product).toHaveProperty("category");
				if (product.category !== null) {
					expect(product.category).toHaveProperty("id");
					expect(product.category).toHaveProperty("name");
				}

				expect(product).toHaveProperty("brand");
				if (product.brand !== null) {
					expect(product.brand).toHaveProperty("id");
					expect(product.brand).toHaveProperty("name");
				}
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
						const res = await app.getAdminProduct(id as string, {
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
				const res = await app.getAdminProduct(faker.string.uuid());

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.getAdminProduct(faker.string.uuid(), {
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

				const res = await app.getAdminProduct(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});