import type { Insertable, Kysely, Selectable } from "kysely";
import type { DB, Users } from "@/types/db.js";

export const create =
	(db: Kysely<DB>) =>
	async (user: Insertable<Users>): Promise<Selectable<Users>["id"]> => {
		const { id } = await db
			.insertInto("users")
			.values(user)
			.returning("id")
			.executeTakeFirstOrThrow();

		return id;
	};
