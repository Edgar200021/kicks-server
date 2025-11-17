import { httpErrors } from "@fastify/sensible";
import type { Selectable } from "kysely";
import { SESSION_PREFIX } from "@/common/const/redis.js";
import type { Users } from "@/common/types/db.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";
import type { Session } from "../types/session.js";

export async function authenticate(
	this: AuthService,
	session: string,
	type: Session,
): Promise<Selectable<Users>> {
	const ttl =
		type === "regular"
			? this.config.sessionTTLMinutes
			: this.config.oauthSessionTtlMinutes;

	const userId = await this.redis.getex(
		`${SESSION_PREFIX}${session}`,
		"EX",
		ttl * 60,
	);

	if (!userId) {
		throw httpErrors.unauthorized("Unauthorized");
	}

	const user = await this.usersRepository.getById(userId);
	if (!user || !user.isVerified || user.isBanned) {
		this.redis.del(userId);
		throw httpErrors.unauthorized("Unauthorized");
	}

	return user;
}
