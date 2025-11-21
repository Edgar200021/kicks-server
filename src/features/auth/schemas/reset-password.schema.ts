import z from "zod";
import { passwordSchema } from "@/features/auth/schemas/password.schema.js";

export const ResetPasswordRequestSchema = z.object({
	email: z.email().nonempty(),
	token: z.string().nonempty(),
	password: passwordSchema,
});

export const ResetPasswordResponseSchema = z.string();

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
