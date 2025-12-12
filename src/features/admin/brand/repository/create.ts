import type { Selectable } from "kysely";
import type { Brand } from "@/common/types/db.js";
import type { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";

export async function create(
	this: AdminBrandRepository,
	name: Selectable<Brand>["name"],
): Promise<Selectable<Brand>> {
	return await this.db
		.insertInto("brand")
		.values({
			name,
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}
