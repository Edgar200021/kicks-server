import type { Selectable } from "kysely";
import type { Category } from "@/common/types/db.js";
import type { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";

export async function getByName(
	this: AdminCategoryRepository,
	name: Selectable<Category>["name"],
): Promise<Selectable<Category> | undefined> {
	return await this.db
		.selectFrom("category")
		.selectAll()
		.where("name", "=", name)
		.executeTakeFirst();
}
