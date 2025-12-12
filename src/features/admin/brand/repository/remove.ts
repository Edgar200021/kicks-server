import type { Selectable } from "kysely";
import type { Brand } from "@/common/types/db.js";
import type { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";

export async function remove(
	this: AdminBrandRepository,
	id: Selectable<Brand>["id"],
): Promise<Selectable<Brand>["id"] | undefined> {
	const brand = await this.db
		.deleteFrom("brand")
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return brand?.id;
}
