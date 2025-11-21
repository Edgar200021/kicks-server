import type { Selectable, Updateable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UsersRepository } from "./users.repository.js";

export async function updateById(
	this: UsersRepository,
	id: Selectable<Users>["id"],
	user: Updateable<Users>,
): Promise<Selectable<Users>["id"]> {
	const { id: userId } = await this.db
		.updateTable("users")
		.set(user)
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirstOrThrow();

	return userId;
}
