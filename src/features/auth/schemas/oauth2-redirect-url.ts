import z from "zod";

export const OAuth2RedirectUrlRequestQuerySchema = z.object({
	redirectPath: z.string().optional(),
});

export type OAuth2RedirectUrlRequestQuery = z.infer<
	typeof OAuth2RedirectUrlRequestQuerySchema
>;
