import {httpErrors} from "@fastify/sensible";
import {DUPLICATE_DETAIL} from "@/common/const/database.js";
import {isDatabaseError} from "@/common/types/database.js";
import type {
	UpdateCategoryRequest,
	UpdateCategoryRequestParams,
} from "@/features/admin/category/schemas/update-category.schema.js";
import type {
	AdminCategoryService
} from "@/features/admin/category/service/admin-category.service.js";

export async function update(
	this: AdminCategoryService,
	data: UpdateCategoryRequest,
	params: UpdateCategoryRequestParams,
) {
	try {
		const categoryId = await this.categoryRepository.updateById(params.id, {
			...data,
			updatedAt: new Date(),
		});

		if (!categoryId) {
			throw httpErrors.notFound(`Category with id ${params.id} not found`);
		}
	} catch (err) {
		if (isDatabaseError(err) && err.detail.includes(DUPLICATE_DETAIL)) {
			throw httpErrors.badRequest(
				`Category with name ${data.name} already exists`,
			);
		}
		throw err;
	}
}