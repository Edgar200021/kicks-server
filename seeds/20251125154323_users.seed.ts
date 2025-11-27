import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";
import type { DB, UserGender } from "@/common/types/db.js";

export async function seed(db: Kysely<DB>): Promise<void> {
	await db
		.insertInto("users")
		.values(
			Array.from({ length: 500 }).map((_, i) => ({
				email: faker.internet.email(),
				password: faker.internet.password(),
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				gender: faker.person.sex() as UserGender,
				isVerified: i % 2 === 0,
			})),
		)
		.execute();
}
