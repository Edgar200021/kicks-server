import {httpErrors} from "@fastify/sensible";
import {DUPLICATE_DETAIL} from "@/common/const/database.js";
import {isDatabaseError} from "@/common/types/database.js";
import type {
	UpdateBrandRequest,
	UpdateBrandRequestParams,
} from "@/features/admin/brand/schemas/update-brand.schema.js";
import type {AdminBrandService} from "@/features/admin/brand/service/admin-brand.service.js";

export async function update(
	this: AdminBrandService,
	data: UpdateBrandRequest,
	params: UpdateBrandRequestParams,
) {
	try {
		const brandId = await this.brandRepository.updateById(params.id, {
			...data,
			updatedAt: new Date(),
		});

		if (!brandId) {
			throw httpErrors.notFound(`Brand with id ${params.id} not found`);
		}
	} catch (err) {
		if (isDatabaseError(err) && err.detail.includes(DUPLICATE_DETAIL)) {
			throw httpErrors.badRequest(
				`Brand with name ${data.name} already exists`,
			);
		}
		throw err;
	}
}