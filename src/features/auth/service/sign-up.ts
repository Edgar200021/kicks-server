import { randomBytes } from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import { VERIFICATION_PREFIX } from "@/common/const/index.js";
import { scryptHash } from "@/common/utils/index.js";
import type { SignUpRequest } from "../schemas/sign-up.schema.js";
import type { AuthService } from "./auth.service.js";

export async function signUp(
	this: AuthService,
	{ email, password, firstName, lastName, gender }: SignUpRequest,
): Promise<void> {
	const user = await this.usersRepository.getByEmail(email);
	if (user) {
		throw httpErrors.badRequest(`User with email ${user.email} already exists`);
	}

	const hashedPassword = await scryptHash(password);
	const id = await this.usersRepository.create({
		email,
		firstName,
		lastName,
		gender,
		password: hashedPassword,
	});

	const token = randomBytes(16).toString("hex");

	await Promise.all([
		this.redis.setex(
			`${VERIFICATION_PREFIX}${token}`,
			this.config.verificationTokenTTLMinutes * 60,
			id,
		),
		this.emailService.sendVerificationEmail(email, token),
	]);
}
