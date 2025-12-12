import z from "zod";
import {ProductGender} from "@/common/types/db.js";
import {
	PRODUCT_DESCRIPTION_MAX_LENGTH,
	PRODUCT_DESCRIPTION_MIN_LENGTH,
	PRODUCT_TITLE_MAX_LENGTH,
	PRODUCT_TITLE_MIN_LENGTH,
} from "@/features/admin/product/const/zod.js";

export const CreateProductRequestSchema = z.object({
	title: z
		.string()
		.nonempty()
		.min(PRODUCT_TITLE_MIN_LENGTH)
		.max(PRODUCT_TITLE_MAX_LENGTH),
	description: z
		.string()
		.nonempty()
		.min(PRODUCT_DESCRIPTION_MIN_LENGTH)
		.max(PRODUCT_DESCRIPTION_MAX_LENGTH),
	gender: z.enum(ProductGender),
	tags: z.string().nonempty().array().optional().default([]),
	categoryId: z.uuid().nonempty(),
	brandId: z.uuid().nonempty(),
});

export const CreateProductResponseSchema = z.object({
	id: z.uuid().nonempty()
})

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;