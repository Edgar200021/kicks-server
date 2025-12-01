import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";

export async function seed(db: Kysely<DB>): Promise<void> {
	const categories = faker.helpers.uniqueArray(faker.commerce.department, 100);

	await db
		.insertInto("category")
		.values(
			Array.from({ length: categories.length }).map((_, i) => ({
				name: categories[i],
			})),
		)
		.execute();
}
