import { httpErrors } from "@fastify/sensible";
import type { Redis } from "ioredis";
import type { Selectable } from "kysely";
import { SESSION_PREFIX } from "@/common/const/redis.js";
import type { Users } from "@/common/types/db.js";
import type { ApplicationConfig } from "@/config/config.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";

export const authenticate = (
	usersRepository: UsersRepository,
	redis: Redis,
	config: ApplicationConfig,
) =>
	async function (
		this: AuthService,
		session: string,
	): Promise<Selectable<Users>> {
		const userId = await redis.getex(
			`${SESSION_PREFIX}${session}`,
			"EX",
			config.sessionTTLMinutes * 60,
		);

		if (!userId) {
			throw httpErrors.unauthorized("Unauthorized");
		}

		const user = await usersRepository.getById(userId);
		if (!user || !user.isVerified || user.isBanned) {
			throw httpErrors.unauthorized("Unauthorized");
		}

		return user;
	};
