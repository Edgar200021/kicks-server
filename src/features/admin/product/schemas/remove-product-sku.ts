import z from "zod";
import {IdParamsSchema} from "@/common/schemas/id-param.schema.js";

export const RemoveProductSkuRequestParamsSchema = IdParamsSchema;

export const RemoveProductSkuResponseSchema = z.null();

export type RemoveProductSkuRequestParams = z.infer<
	typeof RemoveProductSkuRequestParamsSchema
>;