import type {
	FacebookSignInRequestQuery,
	FacebookSignInResponse,
} from "../../schemas/facebook-sign-in.schema.js";
import type { AuthService } from "../auth.service.js";

export async function facebookSignIn(
	this: AuthService,
	data: FacebookSignInRequestQuery,
	cookieState: string,
): Promise<{
	sessionId: string;
	data: FacebookSignInResponse;
	redirectUrl: string;
}> {
	const redirectPath = this.verifyOAuthState(data.state, cookieState);

	const facebookUser = await this.oauth2Service.getFacebookUser(data.code);

	const dbUser = await this.usersRepository.getByEmail(facebookUser.email);

	if (!dbUser) {
		const user = await this.usersRepository.create({
			facebookId: facebookUser.id,
			email: facebookUser.email,
			firstName: facebookUser.first_name,
			lastName: facebookUser.last_name,
			gender: facebookUser.gender,
			isVerified: true,
		});

		return await this.generateSessionAndReturnData(user, redirectPath);
	}

	if (!dbUser.googleId) {
		await this.usersRepository.updateById(dbUser.id, {
			facebookId: facebookUser.id,
		});
	}

	return await this.generateSessionAndReturnData(dbUser, redirectPath);
}
