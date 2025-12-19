import {Kysely, OperandExpression, Selectable, sql, SqlBool, Updateable} from "kysely";
import type {Category, DB} from "@/common/types/db.js";
import {
	GetAllCategoriesRequestQuery
} from "@/features/admin/category/schemas/get-all-categories.schema.js";

export class AdminCategoryRepository {

	constructor(readonly db: Kysely<DB>) {
	}

	async getAll(
		query: GetAllCategoriesRequestQuery,
	): Promise<Selectable<Category>[]> {
		return await this.db
			.selectFrom("category")
			.selectAll()
			.where((eb) => {
				const ands: OperandExpression<SqlBool>[] = [];

				if (query.search) {
					ands.push(eb("name", "ilike", `%${query.search}%`));
				}

				if (query.startDate) {
					ands.push(eb("createdAt", ">=", query.startDate));
				}

				if (query.endDate) {
					ands.push(eb("createdAt", "<=", query.endDate));
				}

				return eb.and(ands);
			})
			.orderBy("createdAt", "desc")
			.execute();
	}

	async getById(
		id: Selectable<Category>["id"],
	): Promise<Selectable<Category> | undefined> {
		return await this.db
			.selectFrom("category")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	}

	async create(
		name: Selectable<Category>["name"],
	): Promise<Selectable<Category>> {
		return await this.db
			.insertInto("category")
			.values({
				name,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	}


	async remove(
		id: Selectable<Category>["id"],
	): Promise<Selectable<Category>["id"] | undefined> {
		const category = await this.db
			.deleteFrom("category")
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return category?.id;
	}

	async updateById(
		id: Selectable<Category>["id"],
		category: Updateable<Category>,
	): Promise<Selectable<Category>["id"] | undefined> {
		const res = await this.db
			.updateTable("category")
			.set({
				...category,
				updatedAt: sql`NOW
            ()`,
			})
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return res?.id;
	}

}