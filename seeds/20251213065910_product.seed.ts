import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";
import { type DB, ProductGender } from "../src/common/types/db.js";

export async function seed(db: Kysely<DB>): Promise<void> {
	const brands = await db.selectFrom("brand").select("id").limit(100).execute();

	const categories = await db
		.selectFrom("category")
		.select("id")
		.limit(100)
		.execute();

	const genders = [
		ProductGender.Men,
		ProductGender.Women,
		ProductGender.Unisex,
	];

	const products = brands.flatMap((brand) =>
		categories.flatMap((category) => {
			const baseTitle =
				faker.commerce.productName() + " " + faker.string.nanoid(6);

			const description = faker.commerce.productDescription();

			return genders.map((gender, index) => ({
				title: baseTitle,
				description,
				gender,
				isDeleted: index === 1 && faker.datatype.boolean(),
				tags: faker.helpers.arrayElements(
					["new", "sale", "popular", "limited", "eco"],
					faker.number.int({ min: 0, max: 3 }),
				),
				brandId: brand.id,
				categoryId: category.id,
			}));
		}),
	);

	await db
		.insertInto("product")
		.values(products)
		.onConflict((oc) =>
			oc.constraint("uq_product_title_gender_category_brand").doNothing(),
		)
		.execute();
}
