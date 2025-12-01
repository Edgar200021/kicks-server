import z from "zod";
import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MIN_LENGTH,
} from "@/features/admin/category/const/zod.js";
import { CategorySchema } from "@/features/admin/category/schemas/category.schema.js";

export const CreateCategoryRequestSchema = z.object({
	name: z
		.string()
		.min(CATEGORY_NAME_MIN_LENGTH)
		.max(CATEGORY_NAME_MAX_LENGTH)
		.nonempty(),
});

export const CreateCategoryResponseSchema = CategorySchema;

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;
export type CreateCategoryResponse = z.infer<
	typeof CreateCategoryResponseSchema
>;
