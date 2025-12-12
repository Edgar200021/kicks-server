import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { type UserGender, UserRole } from "../../../../src/common/types/db.js";
import {
	GET_ALL_ADMIN_PRODUCTS_BRAND_MAX_LENGTH,
	GET_ALL_ADMIN_PRODUCTS_CATEGORY_MAX_LENGTH,
	GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
	GET_ALL_ADMIN_PRODUCTS_SEARCH_MAX_LENGTH,
	GET_ALL_ADMIN_PRODUCTS_TAGS_MAX_LENGTH,
} from "../../../../src/features/admin/product/const/zod.js";
import { generatePassword, withTestApp } from "../../../testApp.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};

	describe("Get All Products", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.getAllAdminProducts({
					headers: new Headers({
						Cookie: session,
					}),
				});

				const data = await res.body.json();

				expect(res.statusCode).toBe(200);
				expect(data.data).toHaveProperty("pageCount");
				expect(data.data.pageCount).toBeTypeOf("number");
				expect(data.data).toHaveProperty("products");
				expect(data.data.products).toBeInstanceOf(Array);

				const product = data.data.products[0];

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
						name: "empty category",
						data: {
							category: "",
						},
					},
					{
						name: "category is too long",
						data: {
							category: faker.string.alpha({
								length: GET_ALL_ADMIN_PRODUCTS_CATEGORY_MAX_LENGTH + 1,
							}),
						},
					},
					{
						name: "empty brand",
						data: {
							brand: "",
						},
					},
					{
						name: "brand is too long",
						data: {
							brand: faker.string.alpha({
								length: GET_ALL_ADMIN_PRODUCTS_BRAND_MAX_LENGTH + 1,
							}),
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
							startDate: "invalid date",
						},
					},
					{
						name: "startDate greater than endDate",
						data: {
							startDate: new Date(new Date().getMilliseconds() + 1000),
							endDate: new Date(),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.getAllAdminProducts({
							headers: new Headers({
								Cookie: session,
							}),
							query: data,
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
					}),
				);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.getAllAdminProducts({});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.getAllAdminProducts({
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});
	});
});
