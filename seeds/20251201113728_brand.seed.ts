import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";
import type { DB } from "../src/common/types/db.js";

export async function seed(db: Kysely<DB>): Promise<void> {
	const brands = faker.helpers.uniqueArray(faker.company.name, 100);

	await db
		.insertInto("brand")
		.values(
			Array.from({ length: brands.length }).map((_, i) => ({
				name: brands[i],
			})),
		)
		.onConflict((oc) => oc.column("name").doNothing())
		.execute();
}
