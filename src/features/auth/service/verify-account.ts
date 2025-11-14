import { httpErrors } from "@fastify/sensible";
import type { Redis } from "ioredis";
import { VERIFICATION_PREFIX } from "@/common/const/redis.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";

import type { VerifyAccountRequest } from "../schemas/verify-account.schema.js";

export const verifyAccount =
	(usersRepository: UsersRepository, redis: Redis) =>
	async (data: VerifyAccountRequest): Promise<void> => {
		const userId = await redis.getdel(`${VERIFICATION_PREFIX}${data.token}`);
		if (!userId) {
			throw httpErrors.badRequest("Account verification failed");
		}

		const user = await usersRepository.getById(userId);
		if (!user || user.isVerified || user.isBanned) {
			throw !user
				? httpErrors.notFound("User not found")
				: user.isBanned
					? httpErrors.badRequest("User is blocked")
					: httpErrors.badRequest(`User is already verified`);
		}

		await usersRepository.update(user.id, {
			isVerified: true,
		});
	};
