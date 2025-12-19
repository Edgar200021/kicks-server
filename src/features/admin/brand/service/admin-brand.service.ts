import type {
	AdminBrandRepository
} from "@/features/admin/brand/repository/admin-brand.repository.js";
import type {
	GetAllBrandsRequestQuery,
	GetAllBrandsResponse
} from "@/features/admin/brand/schemas/get-all-brands.schema.js";
import type {
	CreateBrandRequest,
	CreateBrandResponse
} from "@/features/admin/brand/schemas/create-brand.schema.js";
import {isDatabaseError} from "@/common/types/database.js";
import {DUPLICATE_DETAIL} from "@/common/const/database.js";
import {httpErrors} from "@fastify/sensible";
import type {RemoveBrandRequestParams} from "@/features/admin/brand/schemas/remove-brand.schema.js";
import type {
	UpdateBrandRequest,
	UpdateBrandRequestParams
} from "@/features/admin/brand/schemas/update-brand.schema.js";

export class AdminBrandService {
	constructor(protected readonly brandRepository: AdminBrandRepository) {
	}

	async getAll(
		query: GetAllBrandsRequestQuery,
	): Promise<GetAllBrandsResponse> {
		const brands = await this.brandRepository.getAll(query);

		return brands.map((b) => ({
			...b,
			createdAt: b.createdAt.toISOString(),
			updatedAt: b.updatedAt.toISOString(),
		}));
	}

	async create(
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


	async update(
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

	async remove(
		params: RemoveBrandRequestParams,
	) {
		const brandId = await this.brandRepository.remove(params.id);

		if (!brandId) {
			throw httpErrors.notFound(`Brand with id ${params.id} not found`);
		}
	}
}