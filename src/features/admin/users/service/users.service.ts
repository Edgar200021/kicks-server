import type { AdminUsersRepository } from "@/features/admin/users/repository/users.repository.js";
import { blockToggle } from "@/features/admin/users/service/block-toggle.js";
import { getAll } from "@/features/admin/users/service/get-all.js";

export class AdminUsersService {
	getAll = getAll;
	blockToggle = blockToggle;

	constructor(protected readonly usersRepository: AdminUsersRepository) {}
}
