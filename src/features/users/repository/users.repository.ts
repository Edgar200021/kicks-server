import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { create } from "./create.js";
import { getAll } from "./get-all.js";
import { getByEmail } from "./get-by-email.js";
import { getById } from "./get-by-id.js";
import { update } from "./update.js";

export class UsersRepository {
	getAll = getAll;
	getById = getById;
	getByEmail = getByEmail;
	create = create;
	update = update;

	constructor(readonly db: Kysely<DB>) {}
}
