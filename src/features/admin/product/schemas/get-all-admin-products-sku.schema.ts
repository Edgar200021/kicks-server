import z from "zod";
import {PageCountSchema} from "@/common/schemas/index.js";
import {AdminProductSkuSchema} from "@/features/admin/product/schemas/admin-product.schema.js";
import {
	GetAllAdminProductsRequestQuerySchema
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";

export const GetAllAdminProductsSkuRequestQuerySchema = GetAllAdminProductsRequestQuerySchema.and(z.object({
	inStock: z
		.enum(["true", "false"])
		.transform((value) => value === "true").optional(),
	minPrice: z.coerce.number<number>().gte(0).optional(),
	maxPrice: z.coerce.number<number>().positive().optional(),
	minSalePrice: z.coerce.number<number>().gte(0).optional(),
	maxSalePrice: z.coerce.number<number>().positive().optional(),
	size: z.coerce.number<number>().positive().optional(),
	color: z
		.string()
		.trim()
		.regex(/^#[0-9a-fA-F]{6}$/, {
			message: "Invalid color format. Must be #RRGGBB",
		}).optional(),
})).refine(obj => obj.minPrice === undefined || obj.maxPrice === undefined || obj.minPrice <= obj.maxPrice, {
	path: ["minPrice"],
	error: "minPrice must be less than or equal to maxPrice",
}).refine(
	obj =>
		obj.minSalePrice === undefined ||
		obj.maxSalePrice === undefined ||
		obj.minSalePrice <= obj.maxSalePrice,
	{
		path: ["minSalePrice"],
		message: "minSalePrice must be less than or equal to maxSalePrice",
	}
)

export const GetAllAdminProductsSkuResponseSchema = z
	.object({
		productsSku: z.array(AdminProductSkuSchema),
	})
	.and(PageCountSchema);

export type GetAllAdminProductsSkuRequestQuery = z.infer<
	typeof GetAllAdminProductsSkuRequestQuerySchema
>;

export type GetAllAdminProductsSkuResponse = z.infer<
	typeof GetAllAdminProductsSkuResponseSchema
>;