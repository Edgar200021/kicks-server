import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { getAll } from "@/features/admin/users/repository/get-all.js";

export class AdminUsersRepository {
	getAll = getAll;

	constructor(readonly db: Kysely<DB>) {}
}
