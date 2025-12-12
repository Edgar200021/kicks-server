import {httpErrors} from "@fastify/sensible";
import {AdminBrandService} from "@/features/admin/brand/service/admin-brand.service.js";
import {
	UpdateBrandRequest,
	UpdateBrandRequestParams
} from "@/features/admin/brand/schemas/update-brand.schema.js";
import {isDatabaseError} from "@/common/types/database.js";
import {DUPLICATE_CODE} from "@/common/const/database.js";

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
		if (isDatabaseError(err) && err.code === DUPLICATE_CODE) {
			throw httpErrors.badRequest(
				`Brand with name ${data.name} already exists`,
			);
		}
		throw err
	}
}