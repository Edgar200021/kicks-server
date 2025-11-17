import z from "zod";

export const GoogleAccessTokenSchema = z.union([
	z.object({
		access_token: z.string().nonempty(),
		expires_in: z.number().nonnegative(),
		scope: z.string().nonempty(),
		token_type: z.string(),
		id_token: z.string().nonempty(),
	}),
	z.object({
		error: z.string().nonempty(),
		error_description: z.string().nonempty(),
	}),
]);

export const GoogleUserSchema = z.object({
	sub: z.string().nonempty(),
	email: z.email().nonempty(),
	email_verified: z.boolean(),
	given_name: z.string(),
	family_name: z.string(),
});

export type GoogleUser = z.infer<typeof GoogleUserSchema>;
