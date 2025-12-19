import {httpErrors} from "@fastify/sensible";
import {DUPLICATE_DETAIL, NOT_PRESENT_DETAIL,} from "@/common/const/database.js";
import {isDatabaseError} from "@/common/types/database.js";
import type {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";
import type {
	CreateProductRequest,
	CreateProductResponse
} from "@/features/admin/product/schemas/create-product.schema.js";
import type {
	UpdateProductRequest,
	UpdateProductRequestParams
} from "@/features/admin/product/schemas/update-product.schema.js";
import type {
	GetAdminProductFiltersResponse
} from "@/features/admin/product/schemas/get-admin-product-filters.schema.js";
import type {
	GetAllAdminProductsRequestQuery,
	GetAllAdminProductsResponse
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import {RemoveProductRequestParams} from "@/features/admin/product/schemas/remove-product.js";

export class AdminProductService {

	constructor(protected readonly productRepository: AdminProductRepository) {
	}


	async getAll(
		query: GetAllAdminProductsRequestQuery,
	): Promise<GetAllAdminProductsResponse> {
		const {products, count} = await this.productRepository.getAll(query);
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

	async create(
		data: CreateProductRequest,
	): Promise<CreateProductResponse> {
		try {
			const id = await this.productRepository.create(data);

			return {id};
		} catch (err) {
			this.handleDatabaseError(err, data);
		}
	}

	async update(
		data: UpdateProductRequest,
		params: UpdateProductRequestParams,
	) {
		try {
			const id = await this.productRepository.update(params.id, data);
			if (!id)
				throw httpErrors.notFound(`Product with id ${params.id} not found`);

		} catch (err) {
			this.handleDatabaseError(err, data);
		}
	}

	async remove(params: RemoveProductRequestParams) {
		const id = await this.productRepository.remove(params.id);
		if (!id) throw httpErrors.notFound(`Product with id ${params.id} not found`);
	}


	async getFilters(): Promise<GetAdminProductFiltersResponse> {
		return await this.productRepository.getFilters();
	}


	protected handleDatabaseError(
		err: unknown,
		data: CreateProductRequest | UpdateProductRequest,
	): never {
		if (isDatabaseError(err)) {
			if (err.detail.includes(DUPLICATE_DETAIL)) {
				throw httpErrors.badRequest(
					"Product with the same brand, category, title and gender already exists",
				);
			}

			if (err.detail.includes(NOT_PRESENT_DETAIL)) {
				const isInvalidCategory = err.detail.includes("category_id");

				throw httpErrors.notFound(
					`${isInvalidCategory ? "Category" : "Brand"} with id ${data[isInvalidCategory ? "categoryId" : "brandId"]} doesn't exist`,
				);
			}
		}

		throw err;
	}
}