import { httpErrors } from "@fastify/sensible";
import { RESET_PASSWORD_PREFIX } from "@/common/const/redis.js";
import { generateToken } from "@/common/utils/generate-token.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";
import type { ForgotPasswordRequest } from "../schemas/forgot-password.schema.js";

export async function forgotPassword(
	this: AuthService,
	data: ForgotPasswordRequest,
) {
	const user = await this.usersRepository.getByEmail(data.email);
	if (!user) {
		throw httpErrors.notFound("User not found");
	}

	const token = generateToken();
	await Promise.all([
		this.emailService.sendResetPasswordEmail(user.email, token),
		this.redis.setex(
			`${RESET_PASSWORD_PREFIX}${token}`,
			this.config.resetPasswordTTLMinutes * 60,
			user.id,
		),
	]);
}
