import type {
	AdminCategoryRepository
} from "@/features/admin/category/repository/admin-category.repository.js";
import {isDatabaseError} from "@/common/types/database.js";
import {DUPLICATE_DETAIL} from "@/common/const/database.js";
import {httpErrors} from "@fastify/sensible";
import {
	GetAllCategoriesRequestQuery,
	GetAllCategoriesResponse
} from "@/features/admin/category/schemas/get-all-categories.schema.js";
import {
	CreateCategoryRequest,
	CreateCategoryResponse
} from "@/features/admin/category/schemas/create-category.schema.js";
import {
	UpdateCategoryRequest,
	UpdateCategoryRequestParams
} from "@/features/admin/category/schemas/update-category.schema.js";
import {
	RemoveCategoryRequestParams
} from "@/features/admin/category/schemas/remove-category.schema.js";

export class AdminCategoryService {
	constructor(protected readonly categoryRepository: AdminCategoryRepository) {
	}

	async getAll(
		query: GetAllCategoriesRequestQuery,
	): Promise<GetAllCategoriesResponse> {
		const categories = await this.categoryRepository.getAll(query);

		return categories.map((c) => ({
			...c,
			createdAt: c.createdAt.toISOString(),
			updatedAt: c.updatedAt.toISOString(),
		}));
	}

	async create(
		data: CreateCategoryRequest,
	): Promise<CreateCategoryResponse> {
		try {
			const newCategory = await this.categoryRepository.create(data.name);

			return {
				...newCategory,
				createdAt: newCategory.createdAt.toISOString(),
				updatedAt: newCategory.updatedAt.toISOString(),
			};
		} catch (err) {
			if (isDatabaseError(err) && err.detail.includes(DUPLICATE_DETAIL)) {
				throw httpErrors.badRequest(
					`Category with name ${data.name} already exists`,
				);
			}
			throw err;
		}
	}


	async update(
		data: UpdateCategoryRequest,
		params: UpdateCategoryRequestParams,
	) {
		try {
			const categoryId = await this.categoryRepository.updateById(params.id, {
				...data,
				updatedAt: new Date(),
			});

			if (!categoryId) {
				throw httpErrors.notFound(`Category with id ${params.id} not found`);
			}
		} catch (err) {
			if (isDatabaseError(err) && err.detail.includes(DUPLICATE_DETAIL)) {
				throw httpErrors.badRequest(
					`Category with name ${data.name} already exists`,
				);
			}
			throw err;
		}
	}

	async remove(
		params: RemoveCategoryRequestParams,
	) {
		const brandId = await this.categoryRepository.remove(params.id);

		if (!brandId) {
			throw httpErrors.notFound(`Category with id ${params.id} not found`);
		}
	}
}