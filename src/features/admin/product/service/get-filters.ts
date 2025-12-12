import type { GetAdminProductFiltersResponse } from "@/features/admin/product/schemas/get-admin-product-filters.schema.js";
import type { AdminProductService } from "@/features/admin/product/service/admin-product.service.js";

export async function getFilters(
	this: AdminProductService,
): Promise<GetAdminProductFiltersResponse> {
	return await this.productRepository.getFilters();
}
