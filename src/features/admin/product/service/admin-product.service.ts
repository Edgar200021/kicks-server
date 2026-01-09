import {httpErrors} from "@fastify/sensible";
import {DUPLICATE_DETAIL, NOT_PRESENT_DETAIL,} from "@/common/const/database.js";
import type {FileUploaderService} from "@/common/services/file-uploader.service.js";
import {isDatabaseError} from "@/common/types/database.js";
import type {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";
import type {
	CreateProductRequest,
	CreateProductResponse,
} from "@/features/admin/product/schemas/create-product.schema.js";
import type {
	GetAdminProductRequestParams,
	GetAdminProductResponse,
} from "@/features/admin/product/schemas/get-admin-product.schema.js";
import type {
	GetAdminProductFiltersResponse
} from "@/features/admin/product/schemas/get-admin-product-filters.schema.js";
import type {
	GetAllAdminProductsRequestQuery,
	GetAllAdminProductsResponse,
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import type {RemoveProductRequestParams} from "@/features/admin/product/schemas/remove-product.js";
import type {
	UpdateProductRequest,
	UpdateProductRequestParams,
} from "@/features/admin/product/schemas/update-product.schema.js";
import {
	GetAllAdminProductsSkuRequestQuery,
	GetAllAdminProductsSkuResponse
} from "@/features/admin/product/schemas/get-all-admin-products-sku.schema.js";
import {
	GetAdminProductSkuRequestParams,
	GetAdminProductSkuResponse
} from "@/features/admin/product/schemas/get-admin-product-sku.schema.js";
import {
	RemoveProductSkuRequestParams
} from "@/features/admin/product/schemas/remove-product-sku.js";
import {createSku} from "@/features/admin/product/service/create-sku.js";
import {updateSku} from "@/features/admin/product/service/update-sku.js";
import {PRODUCT_SKU_FILE_MAX_LENGTH} from "@/features/admin/product/const/zod.js";
import {MultipartFile} from "@fastify/multipart";

export class AdminProductService {
	createSku = createSku
	updateSku = updateSku

	constructor(
		protected readonly productRepository: AdminProductRepository,
		protected readonly fileUploader: FileUploaderService,
	) {
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

	async getAllSku(
		query: GetAllAdminProductsSkuRequestQuery,
	): Promise<GetAllAdminProductsSkuResponse> {
		const {productsSku, count} = await this.productRepository.getAllSku(query);
		const pageCount = Math.ceil(Number(count) / query.limit);

		return {
			pageCount,
			productsSku: productsSku.map(({product, ...p}) => ({
				...p,
				price: p.price / 100,
				salePrice: p.salePrice ? p.salePrice / 100 : null,
				createdAt: p.createdAt.toISOString(),
				updatedAt: p.updatedAt.toISOString(),
				product: {
					...product,
					createdAt: product.createdAt.toISOString(),
					updatedAt: product.updatedAt.toISOString(),
				}
			})),
		};
	}

	async getById(
		params: GetAdminProductRequestParams,
	): Promise<GetAdminProductResponse> {
		const product = await this.productRepository.getById(params.id);
		if (!product) throw httpErrors.notFound("Product doesn't exist");

		return {
			...product,
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString(),
		};
	}

	async getSkuById(
		params: GetAdminProductSkuRequestParams,
	): Promise<GetAdminProductSkuResponse> {
		const productSku = await this.productRepository.getSkuById(params.id);
		if (!productSku) throw httpErrors.notFound("Product sku doesn't exist");

		return {
			...productSku,
			createdAt: productSku.createdAt.toISOString(),
			updatedAt: productSku.updatedAt.toISOString(),
			price: productSku.price / 100,
			salePrice: productSku.salePrice ? productSku.salePrice / 100 : null,
			product: {
				...productSku.product,
				createdAt: productSku.createdAt.toISOString(),
				updatedAt: productSku.updatedAt.toISOString()
			}
		};
	}

	async create(data: CreateProductRequest): Promise<CreateProductResponse> {
		try {
			const id = await this.productRepository.create(data);

			return {id};
		} catch (err) {
			this.handleDatabaseError(err);
		}
	}


	async update(data: UpdateProductRequest, params: UpdateProductRequestParams) {
		try {
			const id = await this.productRepository.update(params.id, data);
			if (!id)
				throw httpErrors.notFound(`Product with id ${params.id} not found`);
		} catch (err) {
			this.handleDatabaseError(err);
		}
	}


	async remove(params: RemoveProductRequestParams) {
		const id = await this.productRepository.remove(params.id);
		if (!id)
			throw httpErrors.notFound(`Product with id ${params.id} not found`);
	}

	async removeSku(params: RemoveProductSkuRequestParams) {
		const id = await this.productRepository.removeSku(params.id);
		if (!id)
			throw httpErrors.notFound(`Product sku with id ${params.id} not found`);
	}

	async getFilters(): Promise<GetAdminProductFiltersResponse> {
		return await this.productRepository.getFilters();
	}


	protected async uploadSkuImages(images: MultipartFile[], existingCount: number) {
		const imageFiles = images.slice(0, PRODUCT_SKU_FILE_MAX_LENGTH - existingCount)

		const uploadResults = await Promise.allSettled(
			imageFiles.map(async (image) => await this.fileUploader.upload(image)),
		);

		const successResults = uploadResults.filter(
			(res) => res.status === "fulfilled",
		).map(res => ({
			imageId: res.value.fileId,
			imageUrl: res.value.fileUrl,
			imageName: res.value.fileName
		}))

		if (!successResults.length)
			throw httpErrors.internalServerError("failed to upload images");

		return successResults
	}

	protected handleDatabaseError(
		err: unknown,
	): never {
		if (!isDatabaseError(err)) throw err

		const detail = err.detail

		if (detail.includes(DUPLICATE_DETAIL)) {
			const isSkuDuplicate = detail.includes("sku")
			const isColorAndSizeDuplicate = detail.includes("color") && detail.includes("size")

			const message = isSkuDuplicate
				? "Product sku with same sku already exist" : isColorAndSizeDuplicate ? `Product SKU with same size and color already exists`
					: "Product with the same brand, category, title and gender already exists"

			throw httpErrors.badRequest(message)
		}


		if (detail.includes(NOT_PRESENT_DETAIL)) {
			const isInvalidProduct = detail.includes("product_id")
			const isInvalidCategory = detail.includes("category_id")

			const entity = isInvalidProduct
				? "Product"
				: isInvalidCategory
					? "Category"
					: "Brand"


			throw httpErrors.notFound(
				`${entity} doesn't exist`,
			)
		}

		throw err
	}
}