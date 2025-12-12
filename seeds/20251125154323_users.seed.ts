import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";
import type { DB, UserGender } from "../src/common/types/db.js";

export async function seed(db: Kysely<DB>): Promise<void> {
	const emails = faker.helpers.uniqueArray(faker.internet.email, 500);

	await db
		.insertInto("users")
		.values(
			Array.from({ length: emails.length }).map((_, i) => ({
				email: emails[i],
				password: faker.internet.password(),
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				gender: faker.person.sex() as UserGender,
				isVerified: i % 2 === 0,
			})),
		)
		.onConflict((oc) => oc.column("email").doNothing())
		.execute();
}
