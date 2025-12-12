import type { Selectable } from "kysely";
import type { Brand } from "@/common/types/db.js";
import type { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";

export async function getByName(
	this: AdminBrandRepository,
	name: Selectable<Brand>["name"],
): Promise<Selectable<Brand> | undefined> {
	return await this.db
		.selectFrom("brand")
		.selectAll()
		.where("name", "=", name)
		.executeTakeFirst();
}
