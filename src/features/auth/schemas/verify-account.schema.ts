import z from "zod";

export const VerifyAccountRequestSchema = z.object({
	token: z.string().max(100).nonempty(),
});

export const VerifyAccountResponeSchema = z.null();

export type VerifyAccountRequest = z.infer<typeof VerifyAccountRequestSchema>;
export type VerifyAccountResponse = z.infer<typeof VerifyAccountResponeSchema>;
