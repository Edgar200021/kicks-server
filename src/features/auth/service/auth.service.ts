import { randomUUID } from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { Redis } from "ioredis";
import type { Selectable } from "kysely";
import {
	OAUTH_REDIRECT_PATH_SEPARATOR,
	SESSION_PREFIX,
} from "@/common/const/index.js";
import type { EmailService } from "@/common/services/email.service.js";
import type { OAuth2Service } from "@/common/services/oauth2.service.js";
import type { Nullable } from "@/common/types/common.js";
import type { Users } from "@/common/types/db.js";
import type { ApplicationConfig } from "@/config/config.js";
import { forgotPassword } from "@/features/auth/service/forgot-password.js";
import { facebookSignIn } from "@/features/auth/service/oauth2/facebook.js";
import { resetPassword } from "@/features/auth/service/reset-password.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import type { User } from "../../users/schemas/user.schema.js";
import type { OAuth2RedirectUrlRequestQuery } from "../schemas/oauth2-redirect-url.js";
import type { Session } from "../types/index.js";
import type { OAuth2Provider } from "../types/oauth2.js";
import { authenticate } from "./authenticate.js";
import { googleSignIn } from "./oauth2/google.js";
import { signIn } from "./sign-in.js";
import { signUp } from "./sign-up.js";
import { verifyAccount } from "./verify-account.js";

export class AuthService {
	signUp = signUp;
	signIn = signIn;
	verifyAccount = verifyAccount;
	authenticate = authenticate;
	googleSignIn = googleSignIn;
	facebookSignIn = facebookSignIn;
	forgotPassword = forgotPassword;
	resetPassword = resetPassword;

	constructor(
		readonly usersRepository: UsersRepository,
		readonly emailService: EmailService,
		readonly oauth2Service: OAuth2Service,
		readonly redis: Redis,
		readonly config: ApplicationConfig,
	) {
		this.generateSession = this.generateSession.bind(this);
		this.generateSessionAndReturnData =
			this.generateSessionAndReturnData.bind(this);
		this.genereateOauth2RedirectUrl =
			this.genereateOauth2RedirectUrl.bind(this);
	}

	async generateSession(userId: Selectable<Users>["id"], type: Session) {
		const id = randomUUID();
		const ttl =
			type === "regular"
				? this.config.sessionTTLMinutes
				: this.config.oauthSessionTtlMinutes;

		await this.redis.setex(`${SESSION_PREFIX}${id}`, ttl * 60, userId);

		return id;
	}

	genereateOauth2RedirectUrl(
		query: OAuth2RedirectUrlRequestQuery,
		provider: OAuth2Provider,
	): { url: string; cookieState: string } {
		const uuid = randomUUID();
		const safeRedirectPath = query.redirectPath
			? encodeURIComponent(query.redirectPath)
			: "";

		const state = safeRedirectPath
			? `${uuid}${OAUTH_REDIRECT_PATH_SEPARATOR}${query.redirectPath}`
			: uuid;

		const generators: Record<OAuth2Provider, (state: string) => string> = {
			google: (s) => this.oauth2Service.generateGoogleRedirectUrl(s),
			facebook: (s) => this.oauth2Service.generateFacebookRedirectUrl(s),
		};

		return {
			url: generators[provider](state),
			cookieState: uuid,
		};
	}

	verifyOAuthState(state: string, cookieState: string): Nullable<string> {
		const [uuidPart, redirectPath] = state.split(OAUTH_REDIRECT_PATH_SEPARATOR);
		const decodedPath = redirectPath ? decodeURIComponent(redirectPath) : "";

		if (uuidPart !== cookieState) {
			throw httpErrors.badRequest("Invalid oauth state");
		}

		return decodedPath || null;
	}

	async generateSessionAndReturnData(
		this: AuthService,
		user: Selectable<Users>,
		redirectPath: Nullable<string>,
	): Promise<{
		sessionId: string;
		data: User;
		redirectUrl: string;
	}> {
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
			redirectUrl: redirectPath
				? `${this.config.clientUrl}${redirectPath}`
				: this.config.clientUrl,
		};
	}
}
