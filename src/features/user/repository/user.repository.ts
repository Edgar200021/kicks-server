import type { Kysely } from "kysely";
import type { DB } from "@/common/types/db.js";
import { deleteNotVerified } from "@/features/user/repository/delete-not-verified.js";
import { create } from "./create.js";
import { getAll } from "./get-all.js";
import { getByEmail } from "./get-by-email.js";
import { getByGoogleId } from "./get-by-google-id.js";
import { getById } from "./get-by-id.js";
import { updateById } from "./update-by-id.js";

export class UserRepository {
	getAll = getAll;
	getById = getById;
	getByGoogleId = getByGoogleId;
	getByEmail = getByEmail;
	create = create;
	updateById = updateById;
	deleteNotVerified = deleteNotVerified;

	constructor(readonly db: Kysely<DB>) {}
}
