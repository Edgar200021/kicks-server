import {Kysely, Selectable, sql} from "kysely";
import type {DB, Users} from "@/common/types/db.js";
import {getAll} from "@/features/admin/user/repository/get-all.js";

export class AdminUserRepository {
	getAll = getAll;

	constructor(readonly db: Kysely<DB>) {
	}

	async getById(
		id: Selectable<Users>["id"],
	): Promise<Selectable<Users> | undefined> {
		return await this.db
			.selectFrom("users")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	}

	async blockToggle(
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

	async remove(
		id: Selectable<Users>["id"],
	): Promise<Selectable<Users>["id"] | undefined> {
		const user = await this.db
			.deleteFrom("users")
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return user?.id;
	}


}