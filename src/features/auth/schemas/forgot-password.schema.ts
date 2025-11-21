import z from "zod";

export const ForgotPasswordRequestSchema = z.object({
	email: z.email().nonempty(),
});

export const ForgotPasswordResponseSchema = z.string();

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
