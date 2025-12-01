import { httpErrors } from "@fastify/sensible";
import type { RemoveCategoryRequestParams } from "@/features/admin/category/schemas/remove-category.schema.js";
import type { AdminCategoryService } from "@/features/admin/category/service/admin-category.service.js";

export async function remove(
	this: AdminCategoryService,
	params: RemoveCategoryRequestParams,
) {
	const categoryId = await this.categoryRepository.remove(params.id);

	if (!categoryId) {
		throw httpErrors.notFound(`Category with id ${params.id} not found`);
	}
}
