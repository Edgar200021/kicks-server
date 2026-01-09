import {
	type Insertable,
	type Kysely,
	type Selectable,
	sql,
	type Updateable,
} from "kysely";
import type { DB, Users } from "@/common/types/db.js";

export class UserRepository {
	constructor(readonly db: Kysely<DB>) {}

	async getById(
		id: Selectable<Users>["id"],
	): Promise<Selectable<Users> | undefined> {
		return await this.db
			.selectFrom("users")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	}

	async getByEmail(
		this: UserRepository,
		email: Selectable<Users>["email"],
	): Promise<Selectable<Users> | undefined> {
		return await this.db
			.selectFrom("users")
			.selectAll()
			.where("email", "=", email)
			.executeTakeFirst();
	}

	async create(user: Insertable<Users>): Promise<Selectable<Users>> {
		return await this.db
			.insertInto("users")
			.values(user)
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	async updateById(
		id: Selectable<Users>["id"],
		user: Updateable<Users>,
	): Promise<Selectable<Users>["id"]> {
		const { id: userId } = await this.db
			.updateTable("users")
			.set(user)
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirstOrThrow();

		return userId;
	}

	async deleteNotVerified(
		this: UserRepository,
	): Promise<Pick<Selectable<Users>, "id">[]> {
		return await this.db
			.deleteFrom("users")
			.where((eb) =>
				eb.and([
					eb("isVerified", "=", false),
					eb(
						"createdAt",
						"<",
						sql<Date>`now
              ()
              - INTERVAL '1 day'`,
					),
				]),
			)
			.returning(["id"])
			.execute();
	}
}
