import type {AdminUserRepository} from "@/features/admin/user/repository/admin-user.repository.js";
import type {
	GetAllUsersRequestQuery,
	GetAllUsersResponse
} from "@/features/admin/user/schemas/get-all-users.schema.js";
import type {BlockToggleRequestParams} from "@/features/admin/user/schemas/block-toggle.schema.js";
import {httpErrors} from "@fastify/sensible";
import type {RemoveUserRequestParams} from "@/features/admin/user/schemas/remove-user.schema.js";

export class AdminUserService {
	constructor(protected readonly userRepository: AdminUserRepository) {
	}

	async getAll(
		query: GetAllUsersRequestQuery,
	): Promise<GetAllUsersResponse> {
		const {users, count} = await this.userRepository.getAll(query);

		const pageCount = Math.ceil(count / query.limit);

		return {
			pageCount,
			users: users.map((u) => ({
				...u,
				createdAt: u.createdAt.toISOString(),
				updatedAt: u.updatedAt.toISOString(),
			})),
		};
	}

	async blockToggle(
		params: BlockToggleRequestParams,
	) {
		const userId = await this.userRepository.blockToggle(params.id);
		if (!userId) {
			throw httpErrors.notFound(`User with id ${params.id} doesn't exist`);
		}
	}

	async remove(
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


}