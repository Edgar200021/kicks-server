import type { AdminUsersRepository } from "@/features/admin/users/repository/users.repository.js";
import { getAll } from "@/features/admin/users/service/get-all.js";

export class AdminUsersService {
	getAll = getAll;

	constructor(protected readonly usersRepository: AdminUsersRepository) {}
}
