import {faker} from "@faker-js/faker";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {type UserGender, UserRole,} from "../../../../src/common/types/db.js";

import {
	buildFile,
	buildFormData,
	generatePassword,
	omit,
	type TestApp,
	withTestApp,
} from "../../../testApp.js";
import {
	PRODUCT_SKU_FILE_MAX_LENGTH,
	PRODUCT_SKU_FILE_MAX_SIZE,
	PRODUCT_SKU_MAX_PRICE,
	PRODUCT_SKU_MAX_SIZE,
	PRODUCT_SKU_MIN_PRICE,
	PRODUCT_SKU_MIN_SIZE,
	PRODUCT_SKU_SKU_MAX_LENGTH,
	PRODUCT_SKU_SKU_MIN_LENGTH
} from "../../../../src/features/admin/product/const/zod.js";
import {AdminProduct} from "../../../../src/features/admin/product/types/db.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};


	const price = faker.number.int({min: PRODUCT_SKU_MIN_PRICE, max: PRODUCT_SKU_MAX_PRICE})
	const productSkuData = {
		sku: faker.string.nanoid({min: PRODUCT_SKU_SKU_MIN_LENGTH, max: PRODUCT_SKU_SKU_MAX_LENGTH}),
		quantity: faker.number.int({min: 1, max: 200}),
		price: price,
		salePrice: faker.number.int({min: 1, max: price}),
		size: faker.number.int({min: PRODUCT_SKU_MIN_SIZE, max: PRODUCT_SKU_MAX_SIZE}),
		color: faker.color.rgb(),
		images: [buildFile()]
	}

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

	describe("Create product sku", () => {
		it("Should return 201 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, product} = await setup(app);

				const res = await app.createProductSku(product.id, {
					body: buildFormData(productSkuData),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(201);
			});
		});


		it("Should be saved into database when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, product} = await setup(app);

				const res = await app.createProductSku(product.id, {
					body: buildFormData(productSkuData),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(201);

				const {
					data: {id},
				} = (await res.body.json()) as { data: { id: string } };

				const dbProduct = await app.db
					.selectFrom("productSku")
					.select("id")
					.where("id", "=", id)
					.executeTakeFirstOrThrow();

				expect(dbProduct).toBeDefined();
			});
		});

		it("Should return 400 status code when product sku already exists", async () => {
			await withTestApp(async app => {
				const {session, product} = await setup(app);

				const res = await app.createProductSku(product.id, {
					body: buildFormData(productSkuData),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(201);

				const secondRes = await app.createProductSku(product.id, {
					body: buildFormData(productSkuData),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(secondRes.statusCode).toBe(400)
			})
		})

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async app => {
				const {session, product} = await setup(app);

				const testCases = [
					{
						name: "missing sku",
						data: buildFormData(omit(productSkuData, "sku"))
					},
					{
						name: `sku length is less than ${PRODUCT_SKU_SKU_MIN_LENGTH}`,
						data: buildFormData({
							...productSkuData,
							"sku": faker.string.nanoid({min: 1, max: PRODUCT_SKU_SKU_MIN_LENGTH - 1})
						})
					},
					{
						name: `sku length is greater than ${PRODUCT_SKU_SKU_MAX_LENGTH}`,
						data: buildFormData({
							...productSkuData,
							"sku": faker.string.nanoid({
								min: PRODUCT_SKU_SKU_MAX_LENGTH + 1,
								max: PRODUCT_SKU_SKU_MAX_LENGTH + 2
							})
						})
					},
					{
						name: "missing quantity",
						data: buildFormData(omit(productSkuData, "quantity"))
					},
					{
						name: "quantity is negative",
						data: buildFormData({...productSkuData, "quantity": -1})
					},
					{
						name: "quantity is zero",
						data: buildFormData({...productSkuData, "quantity": 0})
					},
					{
						name: "missing price",
						data: buildFormData(omit(productSkuData, "price"))
					},
					{
						name: "price is negative",
						data: buildFormData({...productSkuData, "price": -1})
					},
					{
						name: "price is zero",
						data: buildFormData({...productSkuData, "price": 0})
					},
					{
						name: `price is less than ${PRODUCT_SKU_MIN_PRICE}`,
						data: buildFormData({...productSkuData, "price": PRODUCT_SKU_MIN_PRICE - 1})
					},
					{
						name: `price is greater than ${PRODUCT_SKU_MAX_PRICE}`,
						data: buildFormData({...productSkuData, "price": PRODUCT_SKU_MAX_PRICE + 1})
					},
					{
						name: "salePrice is negative",
						data: buildFormData({...productSkuData, "salePrice": -1})
					},
					{
						name: "salePrice is zero",
						data: buildFormData({...productSkuData, "salePrice": 0})
					},
					{
						name: "salePrice is greater than price",
						data: buildFormData({...productSkuData, "salePrice": productSkuData.price + 1})
					},
					{
						name: "missing size",
						data: buildFormData(omit(productSkuData, "size"))
					},
					{
						name: "size is negative",
						data: buildFormData({...productSkuData, "size": -1})
					},
					{
						name: "size is zero",
						data: buildFormData({...productSkuData, "size": 0})
					},
					{
						name: `size is less than ${PRODUCT_SKU_MIN_SIZE}`,
						data: buildFormData({...productSkuData, "size": PRODUCT_SKU_MIN_SIZE - 1})
					},
					{
						name: `size is greater than ${PRODUCT_SKU_MAX_SIZE}`,
						data: buildFormData({...productSkuData, "size": PRODUCT_SKU_MAX_SIZE + 1})
					},
					{
						name: "missing color",
						data: buildFormData(omit(productSkuData, "color"))
					},
					{
						name: "invalid color",
						data: buildFormData({...productSkuData, "color": "not hex"})
					},
					{
						name: "missing images",
						data: buildFormData(omit(productSkuData, "images"))
					},
					{
						name: `image size is greater than ${PRODUCT_SKU_FILE_MAX_SIZE}`,
						data: buildFormData({
							...productSkuData,
							"images": [buildFile({format: "image", big: true})]
						})
					},
					{
						name: `number of images is greater than ${PRODUCT_SKU_FILE_MAX_LENGTH}`,
						data: buildFormData({
							...productSkuData,
							"images": Array.from({length: PRODUCT_SKU_FILE_MAX_LENGTH + 1}, () => buildFile())
						})
					},
					{
						name: "invalid file type",
						data: buildFormData({
							...productSkuData,
							"images": [buildFile({format: "pdf"})]
						})
					}
				]

				for (const {name, data} of testCases) {
					const res = await app.createProductSku(product.id, {
						body: data,
						headers: new Headers({
							Cookie: session,
						}),
					});

					expect(res.statusCode, `${name} → wrong status`).toBe(400);
				}
			})
		})

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.createProductSku(faker.string.uuid());

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.createProductSku(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when product doesn't exist", async () => {
			await withTestApp(async (app) => {
				const {session} = await setup(app);

				const res = await app.createProductSku(faker.string.uuid(), {
					body: buildFormData(productSkuData),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});