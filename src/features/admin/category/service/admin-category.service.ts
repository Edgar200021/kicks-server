import type { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";
import { create } from "@/features/admin/category/service/create.js";
import { getAll } from "@/features/admin/category/service/get-all.js";
import { remove } from "@/features/admin/category/service/remove.js";
import { update } from "@/features/admin/category/service/update.js";

export class AdminCategoryService {
	getAll = getAll;
	create = create;
	update = update;
	remove = remove;

	constructor(protected readonly categoryRepository: AdminCategoryRepository) {}
}
