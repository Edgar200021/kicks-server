import z from "zod";
import { UserSchema } from "@/features/users/schemas/user.schema.js";

export const FacebookSignInRequestSchema = z.object({
	code: z.string(),
	state: z.string(),
});

export const FacebookSignInResponseSchema = UserSchema;

export type FacebookSignInRequest = z.infer<typeof FacebookSignInRequestSchema>;
export type FacebookSignInResponse = z.infer<
	typeof FacebookSignInResponseSchema
>;
