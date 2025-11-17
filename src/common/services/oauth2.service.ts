import { httpErrors } from "@fastify/sensible";
import z from "zod";
import type { ApplicationConfig } from "@/config/config.js";
import {
	GOOGLE_OAUTH_AUTHORIZE_URL,
	GOOGLE_OAUTH_TOKEN_URL,
} from "../const/oauth2.js";
import {
	GoogleAccessTokenSchema,
	type GoogleUser,
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

	async getGoogleUser(code: string): Promise<GoogleUser> {
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

		const userRes = await fetch(
			"https://openidconnect.googleapis.com/v1/userinfo",
			{
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
				},
			},
		);

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
}
