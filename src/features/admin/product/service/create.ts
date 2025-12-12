import {httpErrors} from "@fastify/sensible";
import {DUPLICATE_DETAIL, NOT_PRESENT_DETAIL} from "@/common/const/database.js";
import {isDatabaseError} from "@/common/types/database.js";
import type {
	CreateProductRequest,
	CreateProductResponse
} from "@/features/admin/product/schemas/create-product.schema.js";
import type {AdminProductService} from "@/features/admin/product/service/admin-product.service.js";

export async function create(
	this: AdminProductService,
	data: CreateProductRequest,
): Promise<CreateProductResponse> {
	try {
		const id = await this.productRepository.create(data);

		return {id}
	} catch (err) {
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