import type { Kysely, Selectable, Updateable } from "kysely";
import type { DB, Users } from "@/common/types/db.js";

export const update =
	(db: Kysely<DB>) =>
	async (
		id: Selectable<Users>["id"],
		user: Updateable<Users>,
	): Promise<Selectable<Users>["id"]> => {
		const { id: userId } = await db
			.updateTable("users")
			.set(user)
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirstOrThrow();

		return userId;
	};
