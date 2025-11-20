import { httpErrors } from "@fastify/sensible";
import z from "zod";
import type { ApplicationConfig } from "@/config/config.js";
import {
	FACEBOOK_OAUTH_AUTHORIZE_URL,
	FACEBOOK_OAUTH_TOKEN_URL,
	FACEBOOK_OAUTH_USER_INFO_URL,
	GOOGLE_OAUTH_AUTHORIZE_URL,
	GOOGLE_OAUTH_TOKEN_URL,
	GOOGLE_OAUTH_USER_INFO_URL,
} from "../const/oauth2.js";
import {
	FacebookOAuth2AccessTokenSchema,
	type FacebookOAuth2User,
	FacebookOAuth2UserSchema,
	GoogleAccessTokenSchema,
	type GoogleOAuth2User,
	GoogleUserSchema,
} from "../schemas/oauth2.js";

export class OAuth2Service {
	constructor(private readonly config: ApplicationConfig) {}

	generateGoogleRedirectUrl(state?: string): string {
		const { clientId, redirectUrl } = this.config.oauth2.google;

		const url = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);

		url.searchParams.append("client_id", clientId);
		url.searchParams.append("redirect_uri", redirectUrl);
		url.searchParams.append("response_type", "code");
		url.searchParams.append("scope", "openid email profile");
		url.searchParams.append("access_type", "offline");

		if (state) {
			url.searchParams.append("state", state);
		}

		return url.toString();
	}

	generateFacebookRedirectUrl(state?: string) {
		const { clientId, redirectUrl } = this.config.oauth2.facebook;

		const url = new URL(FACEBOOK_OAUTH_AUTHORIZE_URL);

		url.searchParams.set("client_id", clientId);
		url.searchParams.set("redirect_uri", redirectUrl);
		url.searchParams.set("scope", "email");
		url.searchParams.set("response_type", "code");
		if (state) {
			url.searchParams.set("state", state);
		}

		return url.toString();
	}

	async getGoogleUser(code: string): Promise<GoogleOAuth2User> {
		const { clientId, clientSecret, redirectUrl } = this.config.oauth2.google;

		const params = new URLSearchParams({
			code: decodeURIComponent(code),
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUrl,
			grant_type: "authorization_code",
		});

		const tokenRes = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params.toString(),
		});

		if (!tokenRes.ok && tokenRes.status >= 500) {
			throw httpErrors.internalServerError(
				"Failed to exchange authorization code with Google.",
			);
		}

		const { success, data: tokenData } =
			await GoogleAccessTokenSchema.safeParseAsync(await tokenRes.json());

		if (!success) {
			throw httpErrors.internalServerError(
				"Invalid token response received from Google.",
			);
		}

		if ("error" in tokenData) {
			throw httpErrors.badRequest(tokenData.error);
		}

		const userRes = await fetch(GOOGLE_OAUTH_USER_INFO_URL, {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
			},
		});

		if (!userRes.ok) {
			throw httpErrors.internalServerError("Failed to fetch Google user info.");
		}

		const { success: userSchemaSuccess, data: userData } =
			await GoogleUserSchema.safeParseAsync(await userRes.json());
		if (!userSchemaSuccess) {
			throw httpErrors.internalServerError(
				"Invalid user response received from Google.",
			);
		}

		return userData;
	}

	async getFacebookUser(code: string): Promise<FacebookOAuth2User> {
		const { clientId, clientSecret, redirectUrl } = this.config.oauth2.facebook;

		const url = new URL(FACEBOOK_OAUTH_TOKEN_URL);

		url.searchParams.set("client_id", clientId);
		url.searchParams.set("client_secret", clientSecret);
		url.searchParams.set("code", code);
		url.searchParams.set("redirect_uri", redirectUrl);

		const res = await fetch(url);
		const { data, error } =
			await FacebookOAuth2AccessTokenSchema.safeParseAsync(await res.json());

		if (error) {
			throw httpErrors.internalServerError(
				"Invalid token response received from Google.",
			);
		}

		if ("error" in data) {
			throw httpErrors.badRequest(data.error);
		}

		const getUserUrl = new URL(FACEBOOK_OAUTH_USER_INFO_URL);
		getUserUrl.searchParams.set(
			"fields",
			"id,first_name,last_name,gender,email",
		);
		getUserUrl.searchParams.set("access_token", data.access_token);

		const userRes = await fetch(getUserUrl.toString());
		if (!userRes.ok) {
			throw httpErrors.internalServerError("Failed to fetch Google user info.");
		}

		const { error: userSchemaError, data: user } =
			await FacebookOAuth2UserSchema.safeParseAsync(await userRes.json());

		if (userSchemaError) {
			throw httpErrors.internalServerError(
				"Invalid user response received from Facebook.",
			);
		}

		return user;
	}
}
