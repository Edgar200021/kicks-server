import z from "zod";
import { passwordSchema } from "@/features/auth/schemas/password.schema.js";
import { UserSchema } from "@/features/user/schemas/user.schema.js";

export const SignInRequestSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});

export const SignInResponseSchema = UserSchema;

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type SignInResponse = z.infer<typeof SignInResponseSchema>;
