import {faker} from "@faker-js/faker";
import {Headers} from "undici";
import {describe, expect, it} from "vitest";
import {type UserGender, UserRole,} from "../../../../src/common/types/db.js";
import {
	GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
	PRODUCT_SKU_FILE_MAX_LENGTH,
	PRODUCT_SKU_FILE_MAX_SIZE,
	PRODUCT_SKU_MAX_PRICE,
	PRODUCT_SKU_MAX_SIZE,
	PRODUCT_SKU_MIN_PRICE,
	PRODUCT_SKU_MIN_SIZE,
	PRODUCT_SKU_SKU_MAX_LENGTH,
	PRODUCT_SKU_SKU_MIN_LENGTH,
} from "../../../../src/features/admin/product/const/zod.js";
import {
	buildFile,
	buildFormData,
	generatePassword,
	type TestApp,
	withTestApp,
} from "../../../testApp.js";
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
				limit: GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
			},
		});
		expect(res.statusCode).toBe(200);

		return {
			session,
			productsSku: (
				(await res.body.json()) as {
					data: {
						productsSku: AdminProductSku[];
					};
				}
			).data.productsSku,
		};
	};

	describe("Update Product Sku", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const {session, productsSku} = await setup(app);
				const newQuantity = productsSku[0].quantity + 1

				const res = await app.updateProductSku(productsSku[0].id, {
					body: buildFormData({
						quantity: newQuantity,
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
				const {session, productsSku} = await setup(app);
				const newQuantity = productsSku[0].quantity + 1

				const res = await app.updateProductSku(productsSku[0].id, {
					body: buildFormData({
						quantity: newQuantity,
					}),
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);

				const getProductSkuResponse = await app.getAdminProductSku(productsSku[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
				})
				expect(getProductSkuResponse.statusCode).toBe(200);

				const productSku = ((await getProductSkuResponse.body.json()) as {
					data: AdminProductSku
				}).data

				expect(productSku).toBeDefined();
				expect(productSku.quantity).not.equal(productsSku[0].quantity);
				expect(productSku.quantity).equal(newQuantity);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const {session, productsSku} = await setup(app);

				const testCases = [
					{
						name: `sku length is less than ${PRODUCT_SKU_SKU_MIN_LENGTH}`,
						data: buildFormData({
							"sku": faker.string.nanoid({min: 1, max: PRODUCT_SKU_SKU_MIN_LENGTH - 1})
						})
					},
					{
						name: `sku length is greater than ${PRODUCT_SKU_SKU_MAX_LENGTH}`,
						data: buildFormData({
							"sku": faker.string.nanoid({
								min: PRODUCT_SKU_SKU_MAX_LENGTH + 1,
								max: PRODUCT_SKU_SKU_MAX_LENGTH + 2
							})
						})
					},
					{
						name: "quantity is negative",
						data: buildFormData({"quantity": -1})
					},
					{
						name: "quantity is zero",
						data: buildFormData({"quantity": 0})
					},
					{
						name: "price is negative",
						data: buildFormData({"price": -1})
					},
					{
						name: "price is zero",
						data: buildFormData({"price": 0})
					},
					{
						name: `price is less than ${PRODUCT_SKU_MIN_PRICE}`,
						data: buildFormData({"price": PRODUCT_SKU_MIN_PRICE - 1})
					},
					{
						name: `price is greater than ${PRODUCT_SKU_MAX_PRICE}`,
						data: buildFormData({"price": PRODUCT_SKU_MAX_PRICE + 1})
					},
					{
						name: "salePrice is negative",
						data: buildFormData({"salePrice": -1})
					},
					{
						name: "salePrice is zero",
						data: buildFormData({"salePrice": 0})
					},
					{
						name: "size is negative",
						data: buildFormData({"size": -1})
					},
					{
						name: "salePrice is greater than price",
						data: buildFormData({price: 500, "salePrice": 501})
					},
					{
						name: "size is zero",
						data: buildFormData({"size": 0})
					},
					{
						name: `size is less than ${PRODUCT_SKU_MIN_SIZE}`,
						data: buildFormData({"size": PRODUCT_SKU_MIN_SIZE - 1})
					},
					{
						name: `size is greater than ${PRODUCT_SKU_MAX_SIZE}`,
						data: buildFormData({"size": PRODUCT_SKU_MAX_SIZE + 1})
					},
					{
						name: "invalid color",
						data: buildFormData({"color": "not hex"})
					},
					{
						name: `image size is greater than ${PRODUCT_SKU_FILE_MAX_SIZE}`,
						data: buildFormData({
							"images": [buildFile({format: "image", big: true})]
						})
					},
					{
						name: `number of images is greater than ${PRODUCT_SKU_FILE_MAX_LENGTH}`,
						data: buildFormData({
							"images": Array.from({length: PRODUCT_SKU_FILE_MAX_LENGTH + 1}, () => buildFile())
						})
					},
					{
						name: "invalid file type",
						data: buildFormData({
							"images": [buildFile({format: "pdf"})]
						})
					}
				];

				for (const {name, data} of testCases) {
					const res = await app.updateProductSku(productsSku[0].id, {
						headers: new Headers({
							Cookie: session,
						}),
						body: data,
					});

					expect(res.statusCode, `${name} → wrong status`).toBe(400);
				}
			});
		});

		it(`Should return 400 status code when trying to add more images than the maximum allowed`, async () => {
			await withTestApp(async app => {
				const {session, productsSku} = await setup(app);

				const res = await app.updateProductSku(productsSku[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: buildFormData({
						images: Array.from({length: PRODUCT_SKU_FILE_MAX_LENGTH}, () => buildFile())
					}),
				})

				expect(res.statusCode).toBe(200)

				const secondRes = await app.updateProductSku(productsSku[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: buildFormData({
						images: [buildFile()]
					}),
				})

				expect(secondRes.statusCode).toBe(400)
			})
		})

		it("Should return 400 status code when product sku already exists", async () => {
			await withTestApp(async (app) => {
				const {session, productsSku} = await setup(app);

				const res = await app.updateProductSku(productsSku[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: buildFormData({
						sku: productsSku[1].id
					}),
				})

				expect(res.statusCode).toBe(400)
			});
		});

		it("Should return 400 status code when salePrice is greater than price", async () => {
			await withTestApp(async (app) => {
				const {session, productsSku} = await setup(app);

				const res = await app.updateProductSku(productsSku[0].id, {
					headers: new Headers({
						Cookie: session,
					}),
					body: buildFormData({
						salePrice: productsSku[0].price + 1
					}),
				})

				expect(res.statusCode).toBe(400)
			});
		})

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.updateProductSku(faker.string.uuid());

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.updateProductSku(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when product sku doesn't exist, category or brand doesn't exist", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);


				const res = await app.updateProductSku(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
					body: buildFormData({
						quantity: 1
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});