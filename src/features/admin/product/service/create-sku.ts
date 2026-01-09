import {AdminProductService} from "@/features/admin/product/service/admin-product.service.js";
import type {
	CreateProductSkuRequest,
	CreateProductSkuRequestParams,
	CreateProductSkuResponse
} from "@/features/admin/product/schemas/create-product-sku.schema.js";

export async function createSku(this: AdminProductService, data: CreateProductSkuRequest,
																params: CreateProductSkuRequestParams,): Promise<CreateProductSkuResponse> {
	try {
		const uploadResults = await this.uploadSkuImages(data.images, 0)

		const id = await this.productRepository.createSku(
			{
				sku: data.sku,
				salePrice: data.salePrice ? data.salePrice * 100 : undefined,
				price: data.price * 100,
				color: data.color,
				size: data.size,
				quantity: data.quantity,
				productId: params.id,
			},
			uploadResults
		);

		return {id};
	} catch (err) {
		this.handleDatabaseError(err)
	}
}