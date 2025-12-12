import type {
	GetAllBrandsRequestQuery,
	GetAllBrandsResponse,
} from "@/features/admin/brand/schemas/get-all-brands.schema.js";
import type { AdminBrandService } from "@/features/admin/brand/service/admin-brand.service.js";

export async function getAll(
	this: AdminBrandService,
	query: GetAllBrandsRequestQuery,
): Promise<GetAllBrandsResponse> {
	const brands = await this.brandRepository.getAll(query);

	return brands.map((b) => ({
		...b,
		createdAt: b.createdAt.toISOString(),
		updatedAt: b.updatedAt.toISOString(),
	}));
}
