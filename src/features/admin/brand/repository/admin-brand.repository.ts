import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { create } from "@/features/admin/brand/repository/create.js";
import { getAll } from "@/features/admin/brand/repository/get-all.js";
import { getById } from "@/features/admin/brand/repository/get-by-id.js";
import { getByName } from "@/features/admin/brand/repository/get-by-name.js";
import { remove } from "@/features/admin/brand/repository/remove.js";
import { updateById } from "@/features/admin/brand/repository/update-by-id.js";

export class AdminBrandRepository {
	getAll = getAll;
	getByName = getByName;
	getById = getById;
	create = create;
	updateById = updateById;
	remove = remove;

	constructor(readonly db: Kysely<DB>) {}
}
