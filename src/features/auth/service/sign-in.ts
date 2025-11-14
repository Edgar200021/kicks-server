import { randomUUID } from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { Redis } from "ioredis";
import { SESSION_PREFIX } from "@/common/const/redis.js";
import { compare } from "@/common/utils/scrypt.js";
import type { ApplicationConfig } from "@/config/config.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import type {
	SignInRequest,
	SignInResponse,
} from "../schemas/sign-in.schema.js";

export const signIn =
	(usersRepository: UsersRepository, redis: Redis, config: ApplicationConfig) =>
	async (data: SignInRequest): Promise<SignInResponse> => {
		const user = await usersRepository.getByEmail(data.email);
		if (!user || !(await compare(data.password, user.password ?? ""))) {
			throw httpErrors.badRequest(`Invalid credentials`);
		}

		if (!user.isVerified || user.isBanned) {
			throw httpErrors.badRequest(
				!user.isVerified ? `Account not verified` : "User is banned",
			);
		}

		const id = randomUUID();

		await redis.setex(
			`${SESSION_PREFIX}${id}`,
			config.sessionTTLMinutes,
			user.id,
		);

		return {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			gender: user.gender,
		};
	};
