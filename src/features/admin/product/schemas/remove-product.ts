import z from "zod";
import {IdParamsSchema} from "@/common/schemas/id-param.schema.js";

export const RemoveProductRequestParamsSchema = IdParamsSchema;

export const RemoveProductResponseSchema = z.null();

export type RemoveProductRequestParams = z.infer<
	typeof RemoveProductRequestParamsSchema
>;