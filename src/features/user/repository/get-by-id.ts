import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UserRepository } from "./user.repository.js";

export async function getById(
	this: UserRepository,
	id: Selectable<Users>["id"],
): Promise<Selectable<Users> | undefined> {
	return await this.db
		.selectFrom("users")
		.selectAll()
		.where("id", "=", id)
		.executeTakeFirst();
}
