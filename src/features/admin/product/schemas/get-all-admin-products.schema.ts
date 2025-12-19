import z from "zod";
import {PageCountSchema} from "@/common/schemas/index.js";
import {PaginationSchema} from "@/common/schemas/pagination.schema.js";
import {ProductGender} from "@/common/types/db.js";
import {
	GET_ALL_ADMIN_PRODUCTS_DEFAULT_LIMIT,
	GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
	GET_ALL_ADMIN_PRODUCTS_SEARCH_MAX_LENGTH,
	GET_ALL_ADMIN_PRODUCTS_TAGS_MAX_LENGTH,
} from "@/features/admin/product/const/zod.js";
import {AdminProductSchema} from "@/features/admin/product/schemas/admin-product.schema.js";

export const GetAllAdminProductsRequestQuerySchema = z
	.object({
		search: z.string().max(GET_ALL_ADMIN_PRODUCTS_SEARCH_MAX_LENGTH).optional(),
		gender: z.enum(ProductGender).optional(),
		tags: z
			.string()
			.trim()
			.nonempty()
			.max(GET_ALL_ADMIN_PRODUCTS_TAGS_MAX_LENGTH)
			.optional()
			.transform((val) => val?.split(",").map(String))
			.pipe(z.string().array().min(1))
			.optional(),
		categoryId: z
			.uuid()
			.trim()
			.nonempty()
			.optional(),
		brandId: z
			.uuid()
			.trim()
			.nonempty()
			.optional(),
		isDeleted: z
			.enum(["true", "false"])
			.transform((value) => value === "true")
			.optional(),
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
	})
	.and(
		PaginationSchema({
			maxLimit: GET_ALL_ADMIN_PRODUCTS_MAX_LIMIT,
			defaultLimit: GET_ALL_ADMIN_PRODUCTS_DEFAULT_LIMIT,
		}),
	)
	.refine(
		(obj) =>
			!obj.startDate || !obj.endDate
				? true
				: obj.endDate.getTime() > obj.startDate.getTime(),
		{path: ["startDate"]},
	);

export const GetAllAdminProductsResponseSchema = z
	.object({
		products: z.array(AdminProductSchema),
	})
	.and(PageCountSchema);

export type GetAllAdminProductsRequestQuery = z.infer<
	typeof GetAllAdminProductsRequestQuerySchema
>;

export type GetAllAdminProductsResponse = z.infer<
	typeof GetAllAdminProductsResponseSchema
>;