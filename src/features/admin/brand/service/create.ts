import {AdminBrandService} from "@/features/admin/brand/service/admin-brand.service.js";
import {
	CreateBrandRequest,
	CreateBrandResponse
} from "@/features/admin/brand/schemas/create-brand.schema.js";
import {isDatabaseError} from "@/common/types/database.js";
import {DUPLICATE_CODE} from "@/common/const/database.js";
import {httpErrors} from "@fastify/sensible";

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
		if (isDatabaseError(err) && err.code === DUPLICATE_CODE) {
			throw httpErrors.badRequest(
				`Brand with name ${data.name} already exists`,
			);
		}
		throw err
	}
}