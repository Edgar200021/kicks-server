import { httpErrors } from "@fastify/sensible";
import type { Selectable } from "kysely";
import type { Users } from "@/common/types/db.js";
import type {
	GoogleSignInRequest,
	GoogleSignInResponse,
} from "../../schemas/google-sign-in.schema.js";
import type { OAuth2RedirectUrlRequestQuery } from "../../schemas/oauth2-redirect-url.js";
import type { AuthService } from "../auth.service.js";

export function generateGoogleRedirectUrl(
	this: AuthService,
	query: OAuth2RedirectUrlRequestQuery,
): string {
	return this.oauth2Service.generateGoogleRedirectUrl(query.redirectPath);
}

export async function googleSignIn(
	this: AuthService,
	data: GoogleSignInRequest,
): Promise<{ sessionId: string; data: GoogleSignInResponse }> {
	const googleUser = await this.oauth2Service.getGoogleUser(data.code);
	if (!googleUser.email_verified) {
		throw httpErrors.badRequest("Email is not verified");
	}

	const dbUser = await this.usersRepository.getByEmail(googleUser.email);

	if (!dbUser) {
		const user = await this.usersRepository.create({
			email: googleUser.email,
			googleId: googleUser.sub,
			firstName: googleUser.given_name,
			lastName: googleUser.family_name,
			isVerified: true,
		});

		return await generateSessionAndReturnData.bind(this)(user);
	}

	if (!dbUser.googleId) {
		await this.usersRepository.update(dbUser.id, { googleId: googleUser.sub });
	}

	return await generateSessionAndReturnData.bind(this)(dbUser);
}

async function generateSessionAndReturnData(
	this: AuthService,
	user: Selectable<Users>,
): Promise<{ sessionId: string; data: GoogleSignInResponse }> {
	const sessionId = await this.generateSession(user.id, "oauth2");

	return {
		sessionId,
		data: {
			email: user.email,
			role: user.role,
			firstName: user.firstName,
			lastName: user.lastName,
			gender: user.gender,
		},
	};
}
