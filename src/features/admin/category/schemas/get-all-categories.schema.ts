import z from "zod";
import { GET_ALL_CATEGORIES_SEARCH_MAX_LENGTH } from "@/features/admin/category/const/zod.js";
import { CategorySchema } from "@/features/admin/category/schemas/category.schema.js";

export const GetAllCatgoriesRequestQuerySchema = z
	.object({
		search: z.string().max(GET_ALL_CATEGORIES_SEARCH_MAX_LENGTH).optional(),
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
	})

	.refine((obj) =>
		!obj.startDate || !obj.endDate
			? true
			: obj.endDate.getTime() > obj.startDate.getTime(),
	);

export const GetAllCategoriesResponseSchema = z.array(CategorySchema);

export type GetAllCategoriesRequestQuery = z.infer<
	typeof GetAllCatgoriesRequestQuerySchema
>;

export type GetAllCategoriesResponse = z.infer<
	typeof GetAllCategoriesResponseSchema
>;
