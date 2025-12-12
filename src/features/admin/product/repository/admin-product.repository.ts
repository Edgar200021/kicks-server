import type {DB} from "@/common/types/db.js";
import {Kysely} from "kysely";
import {getAll} from "./get-all.js"

export class AdminProductRepository {
	getAll = getAll

	constructor(readonly db: Kysely<DB>) {
	}
}