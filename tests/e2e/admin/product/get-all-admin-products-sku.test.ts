import {faker} from "@faker-js/faker";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {type UserGender, UserRole} from "../../../../src/common/types/db.js";
import {
	GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
	GET_ALL_ADMIN_PRODUCTS_SEARCH_MAX_LENGTH,
	GET_ALL_ADMIN_PRODUCTS_TAGS_MAX_LENGTH,
} from "../../../../src/features/admin/product/const/zod.js";
import {generatePassword, withTestApp} from "../../../testApp.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};

	describe("Get All Products Sku", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.getAllAdminProductsSku({
					headers: new Headers({
						Cookie: session,
					}),
				});

				const data = await res.body.json();

				expect(res.statusCode).toBe(200);
				expect(data.data).toHaveProperty("pageCount");
				expect(data.data.pageCount).toBeTypeOf("number");
				expect(data.data).toHaveProperty("productsSku");
				expect(data.data.productsSku).toBeInstanceOf(Array);

				const product = data.data.productsSku[0];

				expect(product).toHaveProperty("id");
				expect(product).toHaveProperty("createdAt");
				expect(product).toHaveProperty("updatedAt");
				expect(product).toHaveProperty("sku");
				expect(product).toHaveProperty("price");
				expect(product).toHaveProperty("salePrice");
				expect(product).toHaveProperty("quantity");
				expect(product).toHaveProperty("color");
				expect(product).toHaveProperty("size");
				expect(product).toHaveProperty("product");
				expect(product).toHaveProperty("images");
				expect(product.images).toBeInstanceOf(Array);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const testCases = [
					{
						name: "page is negative",
						data: {
							page: -1,
						},
					},
					{
						name: "page is zero",
						data: {
							page: 0,
						},
					},
					{
						name: "limit is negative",
						data: {
							limit: -1,
						},
					},
					{
						name: "limit is zero",
						data: {
							limit: 0,
						},
					},
					{
						name: "limit is too large",
						data: {
							limit: GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT + 1,
						},
					},
					{
						name: "isDeleted is not boolean",
						data: {
							isDeleted: "invalid value",
						},
					},
					{
						name: "invalid gender",
						data: {
							gender: "invalid gender",
						},
					},
					{
						name: "search is too long",
						data: {
							search: faker.string.alpha({
								length: GET_ALL_ADMIN_PRODUCTS_SEARCH_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "empty tags",
						data: {
							tags: "",
						},
					},
					{
						name: "tags is too long",
						data: {
							tags: faker.string.alpha({
								length: GET_ALL_ADMIN_PRODUCTS_TAGS_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "empty categoryId",
						data: {
							categoryId: "",
						},
					},
					{
						name: "empty brandId",
						data: {
							brandId: "",
						},
					},
					{
						name: "invalid startDate",
						data: {
							startDate: "invalid date",
						},
					},
					{
						name: "invalid endDate",
						data: {
							endDate: "invalid date",
						},
					},
					{
						name: "startDate greater than endDate",
						data: {
							startDate: new Date(new Date().getMilliseconds() + 1000),
							endDate: new Date(),
						},
					},
					{
						name: "invalid inStock",
						data: {
							inStock: "not boolean"
						}
					},
					{
						name: "minPrice is negative",
						data: {
							minPrice: -1
						}
					},
					{
						name: "maxPrice is negative",
						data: {
							maxPrice: -1
						}
					},
					{
						name: "maxPrice is zero",
						data: {
							maxPrice: 0
						}
					},
					{
						name: "minPrice greater than negative",
						data: {
							minPrice: 100,
							maxPrice: 50,
						}
					},
					{
						name: "minSalePrice is negative",
						data: {
							minSalePrice: -1
						}
					},
					{
						name: "maxSalePrice is negative",
						data: {
							maxSalePrice: -1
						}
					},
					{
						name: "maxSalePrice is zero",
						data: {
							maxSalePrice: 0
						}
					},
					{
						name: "size is negative",
						data: {
							size: -1
						}
					},
					{
						name: "size is zero",
						data: {
							size: 0
						}
					},
					{
						name: "invalid color",
						data: {
							color: "not hex"
						}
					},
				];


				for (const {name, data} of testCases) {
					const res = await app.getAllAdminProductsSku({
						headers: new Headers({
							Cookie: session,
						}),
						query: data,
					});

					expect(res.statusCode, `${name} → wrong status`).toBe(400);
				}
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.getAllAdminProductsSku({});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.getAllAdminProductsSku({
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});
	});
});