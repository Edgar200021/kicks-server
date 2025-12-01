import { httpErrors } from "@fastify/sensible";
import type { RemoveUserRequestParams } from "@/features/admin/user/schemas/remove-user.schema.js";
import type { AdminUserService } from "@/features/admin/user/service/admin-users.service.js";

export async function remove(
	this: AdminUserService,
	params: RemoveUserRequestParams,
) {
	const user = await this.userRepository.getById(params.id);
	if (!user) {
		throw httpErrors.notFound(`User with id ${params.id} not found`);
	}

	if (user.isVerified && !user.isBanned) {
		throw httpErrors.badRequest(
			`Verified users must be banned before they can be removed.`,
		);
	}

	const now = new Date();
	now.setDate(now.getDate() - 1);

	if (
		!user.isVerified &&
		!user.isBanned &&
		user.createdAt.getTime() > now.getTime()
	) {
		throw httpErrors.badRequest(
			"Unverified & unbanned users younger than 24h cannot be removed.",
		);
	}

	await this.userRepository.remove(user.id);
}
