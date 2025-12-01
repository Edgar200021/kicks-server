import { httpErrors } from "@fastify/sensible";
import type {
	GoogleSignInRequestQuery,
	GoogleSignInResponse,
} from "../../schemas/google-sign-in.schema.js";
import type { AuthService } from "../auth.service.js";

export async function googleSignIn(
	this: AuthService,
	data: GoogleSignInRequestQuery,
	cookieState: string,
): Promise<{
	sessionId: string;
	data: GoogleSignInResponse;
	redirectUrl: string;
}> {
	const redirectPath = this.verifyOAuthState(data.state, cookieState);

	const googleUser = await this.oauth2Service.getGoogleUser(data.code);
	if (!googleUser.email_verified) {
		throw httpErrors.badRequest("Email is not verified");
	}

	const dbUser = await this.userRepository.getByEmail(googleUser.email);

	if (!dbUser) {
		const user = await this.userRepository.create({
			email: googleUser.email,
			googleId: googleUser.sub,
			firstName: googleUser.given_name,
			lastName: googleUser.family_name,
			isVerified: true,
		});

		return await this.generateSessionAndReturnData(user, redirectPath);
	}

	if (!dbUser.googleId) {
		await this.userRepository.updateById(dbUser.id, {
			googleId: googleUser.sub,
		});
	}

	return await this.generateSessionAndReturnData(dbUser, redirectPath);
}
