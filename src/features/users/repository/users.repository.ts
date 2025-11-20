import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { deleteNotVerified } from "@/features/users/repository/delete-not-verified.js";
import { create } from "./create.js";
import { getAll } from "./get-all.js";
import { getByEmail } from "./get-by-email.js";
import { getByGoogleId } from "./get-by-google-id.js";
import { getById } from "./get-by-id.js";
import { update } from "./update.js";

export class UsersRepository {
	getAll = getAll;
	getById = getById;
	getByGoogleId = getByGoogleId;
	getByEmail = getByEmail;
	create = create;
	update = update;
	deleteNotVerified = deleteNotVerified;

	constructor(readonly db: Kysely<DB>) {}
}
