import { randomBytes } from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { Redis } from "ioredis";
import { VERIFICATION_PREFIX } from "@/common/const/redis.js";
import type { EmailService } from "@/common/services/email.service.js";
import { scryptHash } from "@/common/utils/scrypt.js";
import type { Config } from "@/config/config.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import type { SignUpRequest } from "../schemas/sign-up.schema.js";

export const signUp =
	(
		usersRepository: UsersRepository,
		redis: Redis,
		emailService: EmailService,
		config: Config,
	) =>
	async (data: SignUpRequest): Promise<void> => {
		const user = await usersRepository.getByEmail(data.email);
		if (user) {
			throw httpErrors.badRequest(
				`User with email ${user.email} already exists`,
			);
		}

		const hashedPassword = await scryptHash(data.password);
		const id = await usersRepository.create({
			email: data.email,
			password: hashedPassword,
		});

		const token = randomBytes(16).toString("hex");

		await Promise.all([
			redis.setex(
				`${VERIFICATION_PREFIX}${token}`,
				config.application.verificationTokenTTLMinutes,
				id,
			),
			emailService.sendVerificationEmail(data.email, token),
		]);
	};
