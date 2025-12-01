import { httpErrors } from "@fastify/sensible";
import type {
	CreateCategoryRequest,
	CreateCategoryResponse,
} from "@/features/admin/category/schemas/create-category.schema.js";
import type { AdminCategoryService } from "@/features/admin/category/service/admin-category.service.js";

export async function create(
	this: AdminCategoryService,
	data: CreateCategoryRequest,
): Promise<CreateCategoryResponse> {
	const category = await this.categoryRepository.getByName(data.name);
	if (category) {
		throw httpErrors.badRequest(
			`Category with name ${data.name} already exists`,
		);
	}

	const newCategory = await this.categoryRepository.create(data.name);

	return {
		...newCategory,
		createdAt: newCategory.createdAt.toISOString(),
		updatedAt: newCategory.updatedAt.toISOString(),
	};
}
