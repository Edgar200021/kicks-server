import { httpErrors } from "@fastify/sensible";
import type {
	UpdateCategoryRequest,
	UpdateCategoryRequestParams,
} from "@/features/admin/category/schemas/update-category.schema.js";
import type { AdminCategoryService } from "@/features/admin/category/service/admin-category.service.js";

export async function update(
	this: AdminCategoryService,
	data: UpdateCategoryRequest,
	params: UpdateCategoryRequestParams,
) {
	const categoryId = await this.categoryRepository.updateById(params.id, data);

	if (!categoryId) {
		throw httpErrors.notFound(`Category with id ${params.id} not found`);
	}
}
