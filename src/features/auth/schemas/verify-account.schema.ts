import z from "zod";
import { VERIFICATION_TOKEN_MAX_LENGTH } from "../const/zod.js";

export const VerifyAccountRequestSchema = z.object({
	token: z.string().max(VERIFICATION_TOKEN_MAX_LENGTH).nonempty(),
});

export const VerifyAccountResponeSchema = z.null();

export type VerifyAccountRequest = z.infer<typeof VerifyAccountRequestSchema>;
export type VerifyAccountResponse = z.infer<typeof VerifyAccountResponeSchema>;
