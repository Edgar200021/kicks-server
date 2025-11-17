import z from "zod";
import { UserSchema } from "@/features/users/schemas/user.schema.js";

export const GoogleSignInRequestSchema = z.object({
	code: z.string(),
});

export const GoogleSignInResponseSchema = UserSchema;

export type GoogleSignInRequest = z.infer<typeof GoogleSignInRequestSchema>;
export type GoogleSignInResponse = z.infer<typeof GoogleSignInResponseSchema>;
