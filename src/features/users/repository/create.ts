import type { Insertable, Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UsersRepository } from "./users.repository.js";

export async function create(
	this: UsersRepository,
	user: Insertable<Users>,
): Promise<Selectable<Users>["id"]> {
	const { id } = await this.db
		.insertInto("users")
		.values(user)
		.returning("id")
		.executeTakeFirstOrThrow();

	return id;
}
