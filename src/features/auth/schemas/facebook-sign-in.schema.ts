import z from "zod";
import { UserSchema } from "@/features/user/schemas/user.schema.js";

export const FacebookSignInRequestQuerySchema = z.object({
	code: z.string(),
	state: z.string(),
});

export const FacebookSignInResponseSchema = UserSchema;

export type FacebookSignInRequestQuery = z.infer<
	typeof FacebookSignInRequestQuerySchema
>;
export type FacebookSignInResponse = z.infer<
	typeof FacebookSignInResponseSchema
>;
