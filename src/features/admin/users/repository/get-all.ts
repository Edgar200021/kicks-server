import type {
	ExpressionBuilder,
	ExpressionWrapper,
	OperandExpression,
	Selectable,
	SqlBool,
} from "kysely";
import type { DB, Users } from "@/common/types/db.js";
import type { AdminUsersRepository } from "@/features/admin/users/repository/users.repository.js";
import type { GetAllUsersRequestQuery } from "@/features/admin/users/schemas/get-all-users.schema.js";

export async function getAll(
	this: AdminUsersRepository,
	query: GetAllUsersRequestQuery,
): Promise<{ count: number; users: Omit<Selectable<Users>, "password">[] }> {
	const users = await this.db
		.selectFrom("users")
		.select([
			"id",
			"createdAt",
			"updatedAt",
			"email",
			"firstName",
			"lastName",
			"gender",
			"facebookId",
			"googleId",
			"isBanned",
			"isVerified",
			"role",
		])
		.where((eb) => buildFilters(eb, query))
		.orderBy("createdAt", "desc")
		.limit(query.limit)
		.offset(query.limit * query.page - query.limit)
		.execute();

	const { count } = await this.db
		.selectFrom("users")
		.select((eb) => eb.fn.countAll<number>().as("count"))
		.where((eb) => buildFilters(eb, query))
		.executeTakeFirstOrThrow();

	return {
		count: Number(count),
		users,
	};
}

function buildFilters(
	eb: ExpressionBuilder<DB, "users">,
	query: GetAllUsersRequestQuery,
): ExpressionWrapper<DB, "users", SqlBool> {
	const ands: OperandExpression<SqlBool>[] = [];

	if (query.startDate) {
		//@ts-expect-error
		ands.push(eb("createdAt", ">=", query.startDate.toISOString()));
	}

	if (query.endDate) {
		//@ts-expect-error
		ands.push(eb("createdAt", "<=", query.endDate.toISOString()));
	}

	if (query.isBanned !== undefined) {
		ands.push(eb("isBanned", "=", query.isBanned));
	}

	if (query.isVerified !== undefined) {
		ands.push(eb("isVerified", "=", query.isVerified));
	}

	if (query.search) {
		ands.push(
			eb.or([
				eb("email", "ilike", `%${query.search}%`),
				eb("firstName", "ilike", `%${query.search}%`),
				eb("lastName", "ilike", `%${query.search}%`),
			]),
		);
	}

	if (query.gender) {
		ands.push(eb("gender", "=", query.gender));
	}

	return eb.and(ands);
}
