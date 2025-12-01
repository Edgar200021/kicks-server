import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { AdminUserRepository } from "@/features/admin/user/repository/admin-user.repository.js";

export async function remove(
	this: AdminUserRepository,
	id: Selectable<Users>["id"],
): Promise<Selectable<Users>["id"] | undefined> {
	const user = await this.db
		.deleteFrom("users")
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return user?.id;
}
