import type { AdminUsersService } from "@/features/admin/users/service/admin-users.service.js";
import type {
	GetAllUsersRequestQuery,
	GetAllUsersResponse,
} from "../schemas/get-all-users.schema.js";

export async function getAll(
	this: AdminUsersService,
	query: GetAllUsersRequestQuery,
): Promise<GetAllUsersResponse> {
	const { users, count } = await this.usersRepository.getAll(query);

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
