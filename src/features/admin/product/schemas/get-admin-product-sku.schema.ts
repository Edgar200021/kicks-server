import z from "zod";
import {IdParamsSchema} from "@/common/schemas/id-param.schema.js";
import {AdminProductSkuSchema} from "@/features/admin/product/schemas/admin-product.schema.js";

export const GetAdminProductSkuRequestParamsSchema = IdParamsSchema
export const GetAdminProductSkuResponseSchema = AdminProductSkuSchema;

export type GetAdminProductSkuRequestParams = z.infer<
	typeof GetAdminProductSkuRequestParamsSchema
>;
export type GetAdminProductSkuResponse = z.infer<
	typeof GetAdminProductSkuResponseSchema
>;