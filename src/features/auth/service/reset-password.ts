import { httpErrors } from "@fastify/sensible";
import { RESET_PASSWORD_PREFIX } from "@/common/const/redis.js";
import { getIsoString } from "@/common/utils/date.js";
import { scryptHash } from "@/common/utils/scrypt.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";
import type { ResetPasswordRequest } from "../schemas/reset-password.schema.js";

export async function resetPassword(
	this: AuthService,
	data: ResetPasswordRequest,
) {
	const userId = await this.redis.getdel(
		`${RESET_PASSWORD_PREFIX}${data.token}`,
	);
	if (!userId) {
		throw httpErrors.badRequest("Invalid request.");
	}

	const user = await this.usersRepository.getById(userId);
	if (!user || user.email !== data.email) {
		throw httpErrors.badRequest("Invalid request");
	}

	const hashedPassword = await scryptHash(data.password);
	await this.usersRepository.updateById(user.id, {
		password: hashedPassword,
		updatedAt: getIsoString(),
	});
}
