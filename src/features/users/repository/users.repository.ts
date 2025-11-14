import type { Kysely } from "kysely";
import type { DB } from "@/types/db.js";
import { create } from "./create.js";
import { getAll } from "./get-all.js";
import { getByEmail } from "./get-by-email.js";
import { getById } from "./get-by-id.js";

export type UsersRepository = ReturnType<typeof createUsersRepository>;

export const createUsersRepository = (db: Kysely<DB>) => {
	return {
		getAll: getAll(db),
		getById: getById(db),
		getByEmail: getByEmail(db),
		create: create(db),
	};
};
