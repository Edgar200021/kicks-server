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

// export type AuthService = ReturnType<typeof createAuthService>;

export class AuthService {
	signUp: ReturnType<typeof signUp>;
	signIn: ReturnType<typeof signIn>;
	verifyAccount: ReturnType<typeof verifyAccount>;
	authenticate: ReturnType<typeof authenticate>;

	constructor(
		usersRepository: UsersRepository,
		emailService: EmailService,
		private readonly redis: Redis,
		private readonly config: ApplicationConfig,
	) {
		this.signUp = signUp(usersRepository, redis, emailService, config);
		this.signIn = signIn(usersRepository);
		this.verifyAccount = verifyAccount(usersRepository, redis);
		this.authenticate = authenticate(usersRepository, redis, config);
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

// export const createAuthService = ({
// 																		usersRepository,
// 																		emailService,
// 																		redis,
// 																		config,
// 																	}: {
// 	usersRepository: UsersRepository;
// 	emailService: EmailService;
// 	redis: Redis;
// 	config: ApplicationConfig;
// }) => {
// 	return {
// 		signUp: signUp(usersRepository, redis, emailService, config),
// 		signIn: signIn(usersRepository),
// 		verifyAccount: verifyAccount(usersRepository, redis),
//
// 		async generateSession(userId: Selectable<Users>["id"]) {
// 			const id = randomUUID();
//
// 			await redis.setex(
// 				`${SESSION_PREFIX}${id}`,
// 				config.sessionTTLMinutes,
// 				userId,
// 			);
//
// 			return id;
// 		},
// 	};
// };
