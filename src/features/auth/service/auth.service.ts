import type { Redis } from "ioredis";
import type { EmailService } from "@/common/services/email.service.js";
import type { Config } from "@/config/config.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import { signIn } from "./sign-in.js";
import { signUp } from "./sign-up.js";
import { verifyAccount } from "./verify-account.js";

export type AuthService = ReturnType<typeof createAuthService>;

export const createAuthService = ({
	usersRepository,
	emailService,
	redis,
	config,
}: {
	usersRepository: UsersRepository;
	emailService: EmailService;
	redis: Redis;
	config: Config;
}) => {
	return {
		signUp: signUp(usersRepository, redis, emailService, config),
		signIn: signIn(usersRepository, redis, config.application),
		verifyAccount: verifyAccount(usersRepository, redis),
	};
};
3;
