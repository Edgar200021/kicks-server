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
	const category = await this.categoryRepository.getByName(data.name);

	if (category && category.id !== params.id) {
		throw httpErrors.badRequest(
			`Category with name ${data.name} already exists`,
		);
	}

	const categoryId = await this.categoryRepository.updateById(params.id, {
		...data,
		updatedAt: new Date(),
	});

	if (!categoryId) {
		throw httpErrors.notFound(`Category with id ${params.id} not found`);
	}
}
