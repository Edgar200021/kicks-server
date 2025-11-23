import { SESSION_PREFIX } from "@/common/const/redis.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";

export async function logout(this: AuthService, session: string) {
	await this.redis.getdel(`${SESSION_PREFIX}${session}`);
}
