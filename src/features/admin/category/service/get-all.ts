import type {
	GetAllCategoriesRequestQuery,
	GetAllCategoriesResponse,
} from "@/features/admin/category/schemas/get-all-categories.schema.js";
import type { AdminCategoryService } from "@/features/admin/category/service/admin-category.service.js";

export async function getAll(
	this: AdminCategoryService,
	query: GetAllCategoriesRequestQuery,
): Promise<GetAllCategoriesResponse> {
	const categories = await this.categoryRepository.getAll(query);

	return categories.map((c) => ({
		...c,
		createdAt: c.createdAt.toISOString(),
		updatedAt: c.updatedAt.toISOString(),
	}));
}
