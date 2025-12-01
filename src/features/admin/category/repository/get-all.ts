import type { OperandExpression, Selectable, SqlBool } from "kysely";
import type { Category } from "@/common/types/db.js";
import type { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";
import type { GetAllCategoriesRequestQuery } from "@/features/admin/category/schemas/get-all-categories.schema.js";

export async function getAll(
	this: AdminCategoryRepository,
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
