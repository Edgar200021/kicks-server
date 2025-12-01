import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { blockToggle } from "@/features/admin/user/repository/block-toggle.js";
import { getAll } from "@/features/admin/user/repository/get-all.js";
import { getById } from "@/features/admin/user/repository/get-by-id.js";
import { remove } from "@/features/admin/user/repository/remove.js";

export class AdminUserRepository {
	getAll = getAll;
	getById = getById;
	blockToggle = blockToggle;
	remove = remove;

	constructor(readonly db: Kysely<DB>) {}
}
