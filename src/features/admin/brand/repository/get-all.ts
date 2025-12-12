import type { OperandExpression, Selectable, SqlBool } from "kysely";
import type { Brand } from "@/common/types/db.js";
import type { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";
import type { GetAllBrandsRequestQuery } from "@/features/admin/brand/schemas/get-all-brands.schema.js";

export async function getAll(
	this: AdminBrandRepository,
	query: GetAllBrandsRequestQuery,
): Promise<Selectable<Brand>[]> {
	return await this.db
		.selectFrom("brand")
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
