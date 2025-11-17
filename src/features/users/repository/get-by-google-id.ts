import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UsersRepository } from "./users.repository.js";

export async function getByGoogleId(
	this: UsersRepository,
	id: Selectable<Users>["googleId"],
): Promise<Selectable<Users> | undefined> {
	return await this.db
		.selectFrom("users")
		.selectAll()
		.where("googleId", "=", id)
		.executeTakeFirst();
}
