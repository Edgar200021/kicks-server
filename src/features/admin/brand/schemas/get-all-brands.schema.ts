import z from "zod";
import { GET_ALL_BRANDS_SEARCH_MAX_LENGTH } from "@/features/admin/brand/const/index.js";
import { BrandSchema } from "@/features/admin/brand/schemas/brand.schema.js";

export const GetAllBrandsRequestQuerySchema = z
	.object({
		search: z.string().max(GET_ALL_BRANDS_SEARCH_MAX_LENGTH).optional(),
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
	})
	.refine(
		(obj) =>
			!obj.startDate || !obj.endDate
				? true
				: obj.endDate.getTime() > obj.startDate.getTime(),
		{
			path: ["startDate"],
		},
	);

export const GetAllBrandsResponseSchema = z.array(BrandSchema);

export type GetAllBrandsRequestQuery = z.infer<
	typeof GetAllBrandsRequestQuerySchema
>;

export type GetAllBrandsResponse = z.infer<typeof GetAllBrandsResponseSchema>;
