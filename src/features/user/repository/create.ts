import type { Insertable, Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UserRepository } from "./user.repository.js";

export async function create(
	this: UserRepository,
	user: Insertable<Users>,
): Promise<Selectable<Users>> {
	return await this.db
		.insertInto("users")
		.values(user)
		.returningAll()
		.executeTakeFirstOrThrow();
}
