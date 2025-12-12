import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";
import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MIN_LENGTH,
} from "@/features/admin/category/const/zod.js";

export const UpdateCategoryRequestParamsSchema = IdParamsSchema;

export const UpdateCategoryRequestSchema = z.object({
	name: z
		.string()
		.trim()
		.min(CATEGORY_NAME_MIN_LENGTH)
		.max(CATEGORY_NAME_MAX_LENGTH)
		.nonempty(),
});
export const UpdateCategoryResponseSchema = z.null();

export type UpdateCategoryRequestParams = z.infer<
	typeof UpdateCategoryRequestParamsSchema
>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;
