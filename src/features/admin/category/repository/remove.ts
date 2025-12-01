import type { Selectable } from "kysely";
import type { Category } from "@/common/types/db.js";
import type { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";

export async function remove(
	this: AdminCategoryRepository,
	id: Selectable<Category>["id"],
): Promise<Selectable<Category>["id"] | undefined> {
	const category = await this.db
		.deleteFrom("category")
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return category?.id;
}
