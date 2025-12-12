import { type Selectable, sql, type Updateable } from "kysely";
import type { Brand } from "@/common/types/db.js";
import type { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";

export async function updateById(
	this: AdminBrandRepository,
	id: Selectable<Brand>["id"],
	brand: Updateable<Brand>,
): Promise<Selectable<Brand>["id"] | undefined> {
	const res = await this.db
		.updateTable("brand")
		.set({
			...brand,
			updatedAt: sql`NOW
        ()`,
		})
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return res?.id;
}
