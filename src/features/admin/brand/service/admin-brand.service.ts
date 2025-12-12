import type { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";
import { create } from "@/features/admin/brand/service/create.js";
import { getAll } from "@/features/admin/brand/service/get-all.js";
import { remove } from "@/features/admin/brand/service/remove.js";
import { update } from "@/features/admin/brand/service/update.js";

export class AdminBrandService {
	getAll = getAll;
	create = create;
	update = update;
	remove = remove;

	constructor(protected readonly brandRepository: AdminBrandRepository) {}
}
