import type { Selectable, Updateable } from "kysely";
import type { Category } from "@/common/types/db.js";
import type { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";

export async function updateById(
	this: AdminCategoryRepository,
	id: Selectable<Category>["id"],
	category: Updateable<Category>,
): Promise<Selectable<Category>["id"] | undefined> {
	const res = await this.db
		.updateTable("category")
		.set(category)
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return res?.id;
}
