import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { AdminUserRepository } from "@/features/admin/user/repository/admin-user.repository.js";

export async function getById(
	this: AdminUserRepository,
	id: Selectable<Users>["id"],
): Promise<Selectable<Users> | undefined> {
	return await this.db
		.selectFrom("users")
		.selectAll()
		.where("id", "=", id)
		.executeTakeFirst();
}
