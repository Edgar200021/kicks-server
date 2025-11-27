import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";

export const BlockToggleRequestParamsSchema = IdParamsSchema;

export const BlockToggleResponseSchema = z.null();

export type BlockToggleRequestParams = z.infer<
	typeof BlockToggleRequestParamsSchema
>;
