import { randomUUID } from "node:crypto";
import type { Redis } from "ioredis";
import type { Selectable } from "kysely";
import { SESSION_PREFIX } from "@/common/const/index.js";
import type { EmailService } from "@/common/services/email.service.js";
import type { OAuth2Service } from "@/common/services/oauth2.service.js";
import type { Users } from "@/common/types/db.js";
import type { ApplicationConfig } from "@/config/config.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import type { OAuth2RedirectUrlRequestQuery } from "../schemas/oauth2-redirect-url.js";
import type { Session } from "../types/index.js";
import type { OAuth2Provider } from "../types/oauth2.js";
import { authenticate } from "./authenticate.js";
import { generateGoogleRedirectUrl, googleSignIn } from "./oauth2/google.js";
import { signIn } from "./sign-in.js";
import { signUp } from "./sign-up.js";
import { verifyAccount } from "./verify-account.js";

export class AuthService {
	signUp = signUp;
	signIn = signIn;
	verifyAccount = verifyAccount;
	authenticate = authenticate;
	private generateGoogleRedirectUrl = generateGoogleRedirectUrl;
	googleSignIn = googleSignIn;

	constructor(
		readonly usersRepository: UsersRepository,
		readonly emailService: EmailService,
		readonly oauth2Service: OAuth2Service,
		readonly redis: Redis,
		readonly config: ApplicationConfig,
	) {
		this.generateSession = this.generateSession.bind(this);
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
	): string {
		if (provider === "google") return this.generateGoogleRedirectUrl(query);

		const x: never = provider;
		return x;
	}
}
