import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";
import { CreateProductRequestSchema } from "@/features/admin/product/schemas/create-product.schema.js";

export const UpdateProductRequestParamsSchema = IdParamsSchema;
export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();

export const UpdateProductResponseSchema = z.null();
export type UpdateProductRequestParams = z.infer<
	typeof UpdateProductRequestParamsSchema
>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
