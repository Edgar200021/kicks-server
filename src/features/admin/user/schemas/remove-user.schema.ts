import z from "zod";
import { IdParamsSchema } from "@/common/schemas/id-param.schema.js";

export const RemoveUserRequestParamsSchema = IdParamsSchema;

export const RemoveUserResponseSchema = z.null();

export type RemoveUserRequestParams = z.infer<
	typeof RemoveUserRequestParamsSchema
>;
