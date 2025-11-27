import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { blockToggle } from "@/features/admin/users/repository/block-toggle.js";
import { getAll } from "@/features/admin/users/repository/get-all.js";

export class AdminUsersRepository {
	getAll = getAll;
	blockToggle = blockToggle;

	constructor(readonly db: Kysely<DB>) {}
}
