import type {MultipartFile, MultipartValue} from "@fastify/multipart";
import z from "zod";
import {IdParamsSchema} from "@/common/schemas/id-param.schema.js";
import {
	PRODUCT_SKU_FILE_MAX_LENGTH,
	PRODUCT_SKU_FILE_MAX_SIZE,
	PRODUCT_SKU_FILE_MIME_TYPES,
	PRODUCT_SKU_MAX_PRICE,
	PRODUCT_SKU_MAX_SIZE,
	PRODUCT_SKU_MIN_PRICE,
	PRODUCT_SKU_MIN_SIZE,
	PRODUCT_SKU_SKU_MAX_LENGTH,
	PRODUCT_SKU_SKU_MIN_LENGTH,
} from "@/features/admin/product/const/zod.js";

export const CreateProductSkuRequestParamsSchema = IdParamsSchema;

export const CreateProductSkuRequestSchema = z
	.object({
		sku: z.preprocess(
			(val) => (val as MultipartValue)?.value || "",
			z
				.string()
				.trim()
				.nonempty()
				.min(PRODUCT_SKU_SKU_MIN_LENGTH)
				.max(PRODUCT_SKU_SKU_MAX_LENGTH),
		),

		quantity: z.preprocess(
			(val) => (val as MultipartValue)?.value || 0,
			z.coerce.number().positive(),
		),
		price: z.preprocess(
			(val) => (val as MultipartValue)?.value || 0,
			z.coerce
				.number()
				.positive()
				.min(PRODUCT_SKU_MIN_PRICE)
				.max(PRODUCT_SKU_MAX_PRICE),
		),
		salePrice: z.preprocess(
			(val) => (val as MultipartValue)?.value || undefined,
			z.coerce.number().positive().optional(),
		),
		size: z.preprocess(
			(val) => (val as MultipartValue)?.value,
			z.coerce.number().min(PRODUCT_SKU_MIN_SIZE).max(PRODUCT_SKU_MAX_SIZE),
		),
		color: z.preprocess(
			(val) => (val as MultipartValue)?.value || "",
			z
				.string()
				.trim()
				.regex(/^#[0-9a-fA-F]{6}$/, {
					message: "Invalid color format. Must be #RRGGBB",
				}),
		),
		images: z.preprocess(
			(val) => (!Array.isArray(val) ? [val] : val),
			z
				.array(
					z
						.custom<MultipartFile>(
							(file) =>
								file &&
								typeof file === "object" &&
								"file" in file &&
								"mimetype" in file &&
								"filename" in file,
						)
						.refine((f) => PRODUCT_SKU_FILE_MIME_TYPES.includes(f.mimetype), {
							message: "Only images are allowed.",
						})
						.refine((f) => f.file.bytesRead <= PRODUCT_SKU_FILE_MAX_SIZE, {
							message: "File is too large.",
						}),
				)
				.nonempty()
				.max(PRODUCT_SKU_FILE_MAX_LENGTH),
		),
	})
	.refine(
		(data) => data.salePrice === undefined || data.salePrice < data.price,
		{
			path: ["salePrice"],
			message: "Sale price must be less than the regular price",
		},
	);

export const CreateProductSkuResponseSchema = z.object({
	id: z.uuid().nonempty(),
});

export type CreateProductSkuRequestParams = z.infer<
	typeof CreateProductSkuRequestParamsSchema
>;
export type CreateProductSkuRequest = z.infer<
	typeof CreateProductSkuRequestSchema
>;
export type CreateProductSkuResponse = z.infer<
	typeof CreateProductSkuResponseSchema
>;