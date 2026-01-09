import z from "zod";
import {IdParamsSchema} from "@/common/schemas/id-param.schema.js";
import {
	CreateProductSkuRequestSchema
} from "@/features/admin/product/schemas/create-product-sku.schema.js";

export const UpdateProductSkuRequestParamsSchema = IdParamsSchema;
export const UpdateProductSkuRequestSchema = CreateProductSkuRequestSchema.partial().refine(
	(data) => {
		if (data.salePrice === undefined || data.price === undefined) return true;

		return data.salePrice < data.price
	},
	{
		path: ["salePrice"],
		message: "Sale price must be less than the regular price",
	},
);
;

export const UpdateProductSkuResponseSchema = z.null();

export type UpdateProductSkuRequestParams = z.infer<
	typeof UpdateProductSkuRequestParamsSchema
>;
export type UpdateProductSkuRequest = z.infer<typeof UpdateProductSkuRequestSchema>;