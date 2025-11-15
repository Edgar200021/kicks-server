import { randomBytes } from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { Redis } from "ioredis";
import { VERIFICATION_PREFIX } from "@/common/const/index.js";
import type { EmailService } from "@/common/services/email.service.js";
import { scryptHash } from "@/common/utils/index.js";
import type { ApplicationConfig } from "@/config/config.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import type { SignUpRequest } from "../schemas/sign-up.schema.js";

export const signUp =
	(
		usersRepository: UsersRepository,
		redis: Redis,
		emailService: EmailService,
		config: ApplicationConfig,
	) =>
	async ({
		email,
		password,
		firstName,
		lastName,
		gender,
	}: SignUpRequest): Promise<void> => {
		const user = await usersRepository.getByEmail(email);
		if (user) {
			throw httpErrors.badRequest(
				`User with email ${user.email} already exists`,
			);
		}

		const hashedPassword = await scryptHash(password);
		const id = await usersRepository.create({
			email,
			firstName,
			lastName,
			gender,
			password: hashedPassword,
		});

		const token = randomBytes(16).toString("hex");

		await Promise.all([
			redis.setex(
				`${VERIFICATION_PREFIX}${token}`,
				config.verificationTokenTTLMinutes * 60,
				id,
			),
			emailService.sendVerificationEmail(email, token),
		]);
	};
