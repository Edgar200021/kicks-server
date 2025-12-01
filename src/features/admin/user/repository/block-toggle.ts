import { type Selectable, sql } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { AdminUserRepository } from "@/features/admin/user/repository/admin-user.repository.js";

export async function blockToggle(
	this: AdminUserRepository,
	id: Selectable<Users>["id"],
): Promise<Selectable<Users>["id"] | undefined> {
	const user = await this.db
		.updateTable("users")
		.set({
			isBanned: sql<boolean>`NOT "is_banned"`,
		})
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return user?.id || undefined;
}
