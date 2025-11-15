import { randomUUID } from "node:crypto";
import type { Redis } from "ioredis";
import type { Selectable } from "kysely";
import { SESSION_PREFIX } from "@/common/const/index.js";
import type { EmailService } from "@/common/services/email.service.js";
import type { Users } from "@/common/types/db.js";
import type { ApplicationConfig } from "@/config/config.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import { authenticate } from "./authenticate.js";
import { signIn } from "./sign-in.js";
import { signUp } from "./sign-up.js";
import { verifyAccount } from "./verify-account.js";

export class AuthService {
	signUp = signUp;
	signIn = signIn;
	verifyAccount = verifyAccount;
	authenticate = authenticate;

	constructor(
		readonly usersRepository: UsersRepository,
		readonly emailService: EmailService,
		readonly redis: Redis,
		readonly config: ApplicationConfig,
	) {
		this.generateSession = this.generateSession.bind(this);
	}

	async generateSession(userId: Selectable<Users>["id"]) {
		const id = randomUUID();

		await this.redis.setex(
			`${SESSION_PREFIX}${id}`,
			this.config.sessionTTLMinutes,
			userId,
		);

		return id;
	}
}
