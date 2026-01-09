import {
	UpdateProductSkuRequest,
	UpdateProductSkuRequestParams
} from "@/features/admin/product/schemas/update-product-sku.schema.js";
import {httpErrors} from "@fastify/sensible";
import {PRODUCT_SKU_FILE_MAX_LENGTH} from "@/features/admin/product/const/zod.js";
import {AdminProductService} from "@/features/admin/product/service/admin-product.service.js";


export async function updateSku(this: AdminProductService, data: UpdateProductSkuRequest, params: UpdateProductSkuRequestParams) {
	try {
		const {images, ...rest} = data
		const productSku = await this.productRepository.getSkuById(params.id)
		if (!productSku)
			throw httpErrors.notFound(`Product sku with id ${params.id} not found`);

		if (productSku.images.length === PRODUCT_SKU_FILE_MAX_LENGTH && images && images.length > 0) throw httpErrors.badRequest("Maximum number of images for this product SKU has already been reached")

		if (rest.salePrice !== undefined && rest.price === undefined && rest.salePrice > productSku.price / 100) throw httpErrors.badRequest("Sale price cannot be greater than the original price")

		const uploadedFiles = images ? await this.uploadSkuImages(images, productSku.images.length) : undefined
		await this.productRepository.updateSku(params.id, {
			...rest,
			price: rest.price ? rest.price * 100 : productSku.price,
			salePrice: rest.salePrice ? rest.salePrice * 100 : productSku.salePrice
		}, uploadedFiles)

	} catch (err) {
		this.handleDatabaseError(err);
	}
}