import { httpErrors } from "@fastify/sensible";
import type { Selectable } from "kysely";
import { SESSION_PREFIX } from "@/common/const/redis.js";
import type { Users } from "@/common/types/db.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";

export async function authenticate(
	this: AuthService,
	session: string,
): Promise<Selectable<Users>> {
	const userId = await this.redis.getex(
		`${SESSION_PREFIX}${session}`,
		"EX",
		this.config.sessionTTLMinutes * 60,
	);

	if (!userId) {
		throw httpErrors.unauthorized("Unauthorized");
	}

	const user = await this.usersRepository.getById(userId);
	if (!user || !user.isVerified || user.isBanned) {
		throw httpErrors.unauthorized("Unauthorized");
	}

	return user;
}
