import { type Selectable, sql } from "kysely";
import type { Users } from "@/common/types/db.js";
import type { UserRepository } from "./user.repository.js";

export async function deleteNotVerified(
	this: UserRepository,
): Promise<Pick<Selectable<Users>, "id">[]> {
	return await this.db
		.deleteFrom("users")
		.where((eb) =>
			eb.and([
				eb("isVerified", "=", false),
				eb("createdAt", "<", sql<Date>`now() - INTERVAL '1 day'`),
			]),
		)
		.returning(["id"])
		.execute();
}
