import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { create } from "./create.js";
import { getAll } from "./get-all.js";
import { getFilters } from "./get-filters.js";

export class AdminProductRepository {
	getAll = getAll;
	getFilters = getFilters;
	create = create;

	constructor(readonly db: Kysely<DB>) {}
}
