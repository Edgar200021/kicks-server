import {httpErrors} from "@fastify/sensible";
import {AdminBrandService} from "@/features/admin/brand/service/admin-brand.service.js";
import {RemoveBrandRequestParams} from "@/features/admin/brand/schemas/remove-brand.schema.js";

export async function remove(
	this: AdminBrandService,
	params: RemoveBrandRequestParams,
) {
	const brandId = await this.brandRepository.remove(params.id);

	if (!brandId) {
		throw httpErrors.notFound(`Brand with id ${params.id} not found`);
	}
}