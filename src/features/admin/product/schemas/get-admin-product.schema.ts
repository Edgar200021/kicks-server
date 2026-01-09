import type z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";
import { AdminProductSchema } from "@/features/admin/product/schemas/admin-product.schema.js";

export const GetAdminProductRequestParamsSchema = IdParamsSchema;
export const GetAdminProductResponseSchema = AdminProductSchema;

export type GetAdminProductRequestParams = z.infer<
	typeof GetAdminProductRequestParamsSchema
>;
export type GetAdminProductResponse = z.infer<
	typeof GetAdminProductResponseSchema
>;
