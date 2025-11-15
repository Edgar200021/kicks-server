import { httpErrors } from "@fastify/sensible";
import { VERIFICATION_PREFIX } from "@/common/const/redis.js";
import type { VerifyAccountRequest } from "../schemas/verify-account.schema.js";
import type { AuthService } from "./auth.service.js";

export async function verifyAccount(
	this: AuthService,
	data: VerifyAccountRequest,
): Promise<void> {
	const userId = await this.redis.getdel(`${VERIFICATION_PREFIX}${data.token}`);
	if (!userId) {
		throw httpErrors.badRequest("Account verification failed");
	}

	const user = await this.usersRepository.getById(userId);
	if (!user || user.isVerified || user.isBanned) {
		throw !user
			? httpErrors.notFound("User not found")
			: user.isBanned
				? httpErrors.badRequest("User is blocked")
				: httpErrors.badRequest(`User is already verified`);
	}

	await this.usersRepository.update(user.id, {
		isVerified: true,
	});
}
