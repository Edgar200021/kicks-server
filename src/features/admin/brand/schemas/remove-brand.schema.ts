import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";

export const RemoveBrandRequestParamsSchema = IdParamsSchema;

export const RemoveBrandResponseSchema = z.null();

export type RemoveBrandRequestParams = z.infer<
	typeof RemoveBrandRequestParamsSchema
>;
