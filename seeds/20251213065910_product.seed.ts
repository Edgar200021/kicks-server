import {faker} from "@faker-js/faker";
import type {Kysely} from "kysely";
import {type DB, ProductGender} from "../src/common/types/db.js";

export async function seed(db: Kysely<DB>): Promise<void> {
	const brands = await db.selectFrom("brand").select("id").limit(10).execute();

	const categories = await db
		.selectFrom("category")
		.select("id")
		.limit(10)
		.execute();

	const genders = [
		ProductGender.Men,
		ProductGender.Women,
		ProductGender.Unisex,
	];

	const products = brands.flatMap((brand) =>
		categories.flatMap((category) => {
			const baseTitle =
				faker.commerce.productName();

			const description = faker.commerce.productDescription();

			return genders.map((gender, index) => ({
				title: baseTitle,
				description,
				gender,
				isDeleted: index === 1 && faker.datatype.boolean(),
				tags: faker.helpers.arrayElements(
					["new", "sale", "popular", "limited", "eco"],
					faker.number.int({min: 0, max: 3}),
				),
				brandId: brand.id,
				categoryId: category.id,
			}));
		}),
	);

	await db.transaction().execute(async trx => {

		const ids = await trx
			.insertInto("product")
			.values(products)
			.onConflict((oc) =>
				oc.constraint("uq_product_title_gender_category_brand").doNothing(),
			)
			.returning("id")
			.execute();

		const uniqueColors = faker.helpers.uniqueArray<string>(faker.color.rgb, 4)

		const sizes = [38, 39, 40, 41, 42]


		const productsSku = ids.flatMap(({id}) => uniqueColors.flatMap(color => {
			const price = faker.number.int({min: 1000, max: 100000})

			return sizes.map((size, index) => ({
				price: price,
				salePrice:
					index % 2 === 0
						? faker.number.int({min: Math.floor(price * 0.5), max: price - 1})
						: null,
				productId: id,
				size,
				color,
				quantity: index % 3 === 0 ? 0 : 50,
				sku: `SKU-${faker.string.nanoid(10)}`,
			}))
		}))


		const productSkuIds = await trx.insertInto("productSku").values(productsSku).onConflict(oc => oc.column("sku").doNothing()).onConflict((oc) =>
			oc.constraint("uq_product_sku_size_color").doNothing(),
		).returning("id").execute()


		await trx.insertInto("productSkuImage").values(productSkuIds.map(({id}) => ({
			productSkuId: id,
			imageUrl: "https://placehold.co/600x400",
			imageName: faker.string.alpha(),
			imageId: faker.string.uuid()
		}))).execute()
	})


}