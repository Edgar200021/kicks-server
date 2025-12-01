import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UserRepository } from "./user.repository.js";

export async function getByEmail(
	this: UserRepository,
	email: Selectable<Users>["email"],
): Promise<Selectable<Users> | undefined> {
	return await this.db
		.selectFrom("users")
		.selectAll()
		.where("email", "=", email)
		.executeTakeFirst();
}
