import z from "zod";
import {
	BRAND_NAME_MAX_LENGTH,
	BRAND_NAME_MIN_LENGTH,
} from "@/features/admin/brand/const/index.js";
import { BrandSchema } from "@/features/admin/brand/schemas/brand.schema.js";

export const CreateBrandRequestSchema = z.object({
	name: z
		.string()
		.trim()
		.min(BRAND_NAME_MIN_LENGTH)
		.max(BRAND_NAME_MAX_LENGTH)
		.nonempty(),
});

export const CreateBrandResponseSchema = BrandSchema;

export type CreateBrandRequest = z.infer<typeof CreateBrandRequestSchema>;
export type CreateBrandResponse = z.infer<typeof CreateBrandResponseSchema>;
