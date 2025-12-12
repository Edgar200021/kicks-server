import type { Selectable } from "kysely";
import type { Category } from "@/common/types/db.js";
import type { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";

export async function create(
	this: AdminCategoryRepository,
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
