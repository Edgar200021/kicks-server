import z from "zod";
import { UserSchema } from "@/features/users/schemas/user.schema.js";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../const/zod.js";

export const SignInRequestSchema = z.object({
	email: z.email(),
	password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const SignInResponseSchema = UserSchema;

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type SignInResponse = z.infer<typeof SignInResponseSchema>;
