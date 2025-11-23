import z from "zod";
import { UserGender } from "../types/db.js";

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

export const FacebookOAuth2AccessTokenSchema = z.union([
	z.object({
		access_token: z.string(),
	}),
	z.object({
		error: z.object({
			message: z.string(),
		}),
	}),
]);

export const FacebookOAuth2UserSchema = z.object({
	id: z.string().nonempty(),
	email: z.email().nonempty(),
	first_name: z.string().nonempty(),
	last_name: z.string().nonempty(),
	gender: z
		.string()
		.transform((gender) =>
			gender === "male"
				? UserGender.Male
				: gender === "female"
					? UserGender.Female
					: undefined,
		)
		.optional(),
});

export type GoogleOAuth2User = z.infer<typeof GoogleUserSchema>;
export type FacebookOAuth2User = z.infer<typeof FacebookOAuth2UserSchema>;
