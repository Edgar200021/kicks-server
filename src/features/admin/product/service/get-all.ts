import type {
	GetAllAdminProductsRequestQuery,
	GetAllAdminProductsResponse,
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import type { AdminProductService } from "@/features/admin/product/service/admin-product.service.js";

export async function getAll(
	this: AdminProductService,
	query: GetAllAdminProductsRequestQuery,
): Promise<GetAllAdminProductsResponse> {
	const { products, count } = await this.productRepository.getAll(query);
	const pageCount = Math.ceil(Number(count) / query.limit);

	return {
		pageCount,
		products: products.map((p) => ({
			...p,
			createdAt: p.createdAt.toISOString(),
			updatedAt: p.updatedAt.toISOString(),
		})),
	};
}
