import {httpErrors} from "@fastify/sensible";
import type {
	CreateCategoryRequest,
	CreateCategoryResponse,
} from "@/features/admin/category/schemas/create-category.schema.js";
import type {
	AdminCategoryService
} from "@/features/admin/category/service/admin-category.service.js";
import {isDatabaseError} from "@/common/types/database.js";
import {DUPLICATE_CODE} from "@/common/const/database.js";

export async function create(
	this: AdminCategoryService,
	data: CreateCategoryRequest,
): Promise<CreateCategoryResponse> {
	try {
		const newCategory = await this.categoryRepository.create(data.name);

		return {
			...newCategory,
			createdAt: newCategory.createdAt.toISOString(),
			updatedAt: newCategory.updatedAt.toISOString(),
		};
	} catch (err) {
		if (isDatabaseError(err) && err.code === DUPLICATE_CODE) {
			throw httpErrors.badRequest(
				`Category with name ${data.name} already exists`,
			);
		}
		throw err
	}
}