import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UserRepository } from "./user.repository.js";

export async function getAll(
	this: UserRepository,
): Promise<Selectable<Users>[]> {
	return await this.db.selectFrom("users").selectAll().execute();
}
