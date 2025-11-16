import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UsersRepository } from "./users.repository.js";

export async function getByEmail(
	this: UsersRepository,
	email: Selectable<Users>["email"],
): Promise<Selectable<Users> | undefined> {
	return await this.db
		.selectFrom("users")
		.selectAll()
		.where("email", "=", email)
		.executeTakeFirst();
}
