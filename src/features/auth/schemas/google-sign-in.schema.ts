import z from "zod";
import { UserSchema } from "@/features/users/schemas/user.schema.js";

export const GoogleSignInRequestQuerySchema = z.object({
	code: z.string(),
	state: z.string(),
});

export const GoogleSignInResponseSchema = UserSchema;

export type GoogleSignInRequestQuery = z.infer<
	typeof GoogleSignInRequestQuerySchema
>;
export type GoogleSignInResponse = z.infer<typeof GoogleSignInResponseSchema>;
