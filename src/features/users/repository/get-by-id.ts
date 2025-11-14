import type { Kysely, Selectable } from "kysely";
import type { DB, Users } from "@/types/db.js";

export const getById =
	(db: Kysely<DB>) =>
	async (
		id: Selectable<Users>["id"],
	): Promise<Selectable<Users> | undefined> => {
		return await db
			.selectFrom("users")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	};
