import { httpErrors } from "@fastify/sensible";
import { isDatabaseError } from "@/common/types/database.js";
import type {
	CreateBrandRequest,
	CreateBrandResponse,
} from "@/features/admin/brand/schemas/create-brand.schema.js";
import type { AdminBrandService } from "@/features/admin/brand/service/admin-brand.service.js";
import {DUPLICATE_DETAIL} from "@/common/const/database.js";

export async function create(
	this: AdminBrandService,
	data: CreateBrandRequest,
): Promise<CreateBrandResponse> {
	try {
		const newBrand = await this.brandRepository.create(data.name);

		return {
			...newBrand,
			createdAt: newBrand.createdAt.toISOString(),
			updatedAt: newBrand.updatedAt.toISOString(),
		};
	} catch (err) {
		if (isDatabaseError(err) && err.detail.includes(DUPLICATE_DETAIL)) {
			throw httpErrors.badRequest(
				`Brand with name ${data.name} already exists`,
			);
		}
		throw err;
	}
}