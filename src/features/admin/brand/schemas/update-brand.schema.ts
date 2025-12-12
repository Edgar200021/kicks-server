import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";
import {
	BRAND_NAME_MAX_LENGTH,
	BRAND_NAME_MIN_LENGTH,
} from "@/features/admin/brand/const/index.js";

export const UpdateBrandRequestParamsSchema = IdParamsSchema;

export const UpdateBrandRequestSchema = z.object({
	name: z
		.string()
		.trim()
		.min(BRAND_NAME_MIN_LENGTH)
		.max(BRAND_NAME_MAX_LENGTH)
		.nonempty(),
});
export const UpdateBrandResponseSchema = z.null();

export type UpdateBrandRequestParams = z.infer<
	typeof UpdateBrandRequestParamsSchema
>;
export type UpdateBrandRequest = z.infer<typeof UpdateBrandRequestSchema>;
