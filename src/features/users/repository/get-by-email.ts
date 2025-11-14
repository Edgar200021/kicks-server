import type { Kysely, Selectable } from "kysely";
import type { DB, Users } from "@/common/types/db.js";

export const getByEmail =
	(db: Kysely<DB>) =>
	async (
		email: Selectable<Users>["email"],
	): Promise<Selectable<Users> | undefined> => {
		return await db
			.selectFrom("users")
			.selectAll()
			.where("email", "=", email)
			.executeTakeFirst();
	};
