import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";

export const RemoveCategoryRequestParamsSchema = IdParamsSchema;

export const RemoveCategoryResponseSchema = z.null();

export type RemoveCategoryRequestParams = z.infer<
	typeof RemoveCategoryRequestParamsSchema
>;
