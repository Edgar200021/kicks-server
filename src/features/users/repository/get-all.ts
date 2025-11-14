import type { Kysely, Selectable } from "kysely";
import type { DB, Users } from "@/types/db.js";

export const getAll =
	(db: Kysely<DB>) => async (): Promise<Selectable<Users>[]> => {
		return await db.selectFrom("users").selectAll().execute();
	};
